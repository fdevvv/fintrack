import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { RUBRO_EMOJI, getSubIcon } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { dolarService } from '@/services/dolar.service';
import { useAddTransaction } from '@/hooks/transactions/useAddTransaction';
import { ST, Sel, Btn } from '@/components/ui/Shared';

const PDFParser = {
  extractLines(content) {
    if (!content.items?.length) return [];
    const map = {};
    content.items.forEach(it => { const y=Math.round(it.transform[5]); if(!map[y])map[y]=[]; map[y].push({x:it.transform[4],t:it.str}); });
    return Object.keys(map).map(Number).sort((a,b)=>b-a).map(y=>map[y].sort((a,b)=>a.x-b.x).map(p=>p.t).join(' ').replace(/\s+/g,' ').trim());
  },
  parseAmt(s) { return Math.round(parseFloat(s.replace(/\./g,'').replace(',','.'))); },
  nameMatch(a,b) { a=(a||'').toUpperCase().replace(/[^A-Z0-9]/g,''); b=(b||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(!a||!b||a.length<3||b.length<3)return false; return a===b||a.includes(b)||b.includes(a)||a.slice(0,6)===b.slice(0,6); },
  parseVisa(lines) {
    const g=[]; let inD=false; let lastDateStr='';
    const dR=/^(\d{2})-(\d{2})-(\d{2})/,cR=/\s(\d{2})\/(\d{2})(?:\s|$)/,mR=/([\d.]+,\d{2})\s*$/;
    const sk=['FECHA','TARJETA 4','TOTAL A PAGAR','IMPUESTO DE SELLOS','IIBB PERCEP','IVA RG','DB.RG','DEV.IMP','SALDO ANTERIOR','SU PAGO'];
    for(const line of lines){const l=line.trim();if(/DETALLE DEL CONSUMO|MONEDA EXTRANJERA|CONSUMOS EN MONEDA|EN DOLARES/.test(l)){inD=true;continue;}if(/Plan V:|Cuotas a vencer/.test(l)){inD=false;continue;}if(!inD||sk.some(s=>l.includes(s)))continue;const dm=dR.exec(l);if(dm)lastDateStr=dm[0];if(!dm&&!lastDateStr)continue;const isU=/USD/.test(l);const mm=mR.exec(l);if(!mm)continue;const mt=isU?parseFloat(mm[1].replace(/\./g,'').replace(',','.')):this.parseAmt(mm[1]);if((isU&&mt<=0)||(!isU&&mt<100))continue;const lineBody=dm?l.substring(dm[0].length).trim():l;let af=lineBody.replace(/^[*KFE]\s+/,'').replace(/^\d+\*/,'').replace(/^[A-Z]+\*/i,'');const cm=cR.exec(af);let cA=0,cT=0;if(cm){cA=parseInt(cm[1]);cT=parseInt(cm[2]);af=af.substring(0,cm.index)+af.substring(cm.index+cm[0].length);}let ref=af.replace(/\b\d{4,}\b/g,'').replace(mR,'').replace(/\/\s*/g,' ').replace(/\s+/g,' ').trim();if(isU)ref=ref.replace(/\b[A-Z0-9]*USD\b/gi,'').replace(/([\d.]+,\d{2})/g,'').replace(/\s+/g,' ').trim();if(!ref||ref.length<2)continue;g.push({nombre:ref.toUpperCase(),monto:mt,cuotaActual:cA,cuotaTotal:cT,tarjeta:'VISA',isUSD:isU});}return g;
  },
  parseMC(lines) {
    const g=[]; let inD=false; let lastDateStr='';
    const dR=/^(\d{2})-([A-Za-z]{3})-(\d{2})/,cR=/\s(\d{2})\/(\d{2})(?:\s|$)/,mR=/([\d.]+,\d{2})\s*$/;
    const sk=['SUBTOTAL','TOTAL A PAGAR','IMPUESTO DE SELLOS','SALDO ANTERIOR','SU PAGO','SALDO PENDIENTE','TOTAL CONSUMOS'];
    for(const line of lines){const l=line.trim();if(/DETALLE DEL CONSUMO|MONEDA EXTRANJERA|CONSUMOS EN MONEDA|EN DOLARES/.test(l)){inD=true;continue;}if(/Cuotas a vencer|OPCIONES DE FINANCIACION/.test(l)){inD=false;continue;}if(!inD||sk.some(s=>l.includes(s)))continue;const dm=dR.exec(l);if(dm)lastDateStr=dm[0];if(!dm&&!lastDateStr)continue;const isU=/USD/.test(l);const mm=mR.exec(l);if(!mm)continue;const mt=isU?parseFloat(mm[1].replace(/\./g,'').replace(',','.')):this.parseAmt(mm[1]);if((isU&&mt<=0)||(!isU&&mt<100))continue;const lineBody=dm?l.substring(dm[0].length).trim():l;let af=lineBody;const cm=cR.exec(af);let cA=0,cT=0;if(cm){cA=parseInt(cm[1]);cT=parseInt(cm[2]);af=af.substring(0,cm.index)+af.substring(cm.index+cm[0].length);}af=af.replace(/^[A-Z]+\*/i,'');let ref=af.replace(/\b\d{4,}\b/g,'').replace(mR,'').replace(/\/\s*/g,' ').replace(/\s+/g,' ').trim();if(isU)ref=ref.replace(/\b[A-Z0-9]*USD\b/gi,'').replace(/([\d.]+,\d{2})/g,'').replace(/\s+/g,' ').trim();if(!ref||ref.length<2)continue;g.push({nombre:ref.toUpperCase(),monto:mt,cuotaActual:cA,cuotaTotal:cT,tarjeta:'MASTERCARD',isUSD:isU});}return g;
  },
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const KNOWN_SUBS = ['NETFLIX','SPOTIFY','YOUTUBE','APPLE','AMAZON','DISNEY','HBO','PARAMOUNT','CRUNCHYROLL','CLAUDE','OPENAI','CHATGPT','ADOBE','MICROSOFT','GOOGLE','DROPBOX','STEAM','TWITCH','DEEZER','MUBI'];

const detectRubro = (nombre, isUSD) => {
  const u = nombre.toUpperCase();
  if (KNOWN_SUBS.some(s => u.includes(s))) return 'Suscripciones';
  return isUSD ? 'Suscripciones' : 'Otros';
};

function ItemPreview({ nombre, rubro }) {
  if (rubro === 'Suscripciones') {
    const svg = getSubIcon(nombre);
    if (svg) return <div style={{width:30,height:30,borderRadius:7,overflow:'hidden',flexShrink:0}} dangerouslySetInnerHTML={{__html:svg}} />;
  }
  return (
    <div style={{width:30,height:30,borderRadius:7,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
      {RUBRO_EMOJI[rubro] || '📎'}
    </div>
  );
}

export function ImportPage() {
  const { year, transactions, categories } = useStore();
  const { showToast } = useUiStore();
  const { add } = useAddTransaction();
  const [card,setCard]=useState('');const [fileName,setFileName]=useState('');const [parsing,setParsing]=useState(false);
  const [parsed,setParsed]=useState(null);const [usdRate,setUsdRate]=useState(null);const [importing,setImporting]=useState(false);
  const [pdfReady,setPdfReady]=useState(!!window.pdfjsLib);const fileRef=useRef(null);
  const [targetMonth,setTargetMonth]=useState(new Date().getMonth()+1);

  useEffect(()=>{if(window.pdfjsLib){setPdfReady(true);return;}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';setPdfReady(true);};document.head.appendChild(s);},[]);

  const handleFile=async(file)=>{if(!card){showToast('Seleccioná tarjeta',true);return;}if(!file||file.type!=='application/pdf'){showToast('Solo PDF',true);return;}setFileName(file.name);setParsed(null);setParsing(true);let att=0;while(!window.pdfjsLib&&att<20){await new Promise(r=>setTimeout(r,300));att++;}if(!window.pdfjsLib){showToast('Error PDF',true);setParsing(false);return;}try{const buf=await file.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;let all=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();all=all.concat(PDFParser.extractLines(c));}const gastos=card==='VISA'?PDFParser.parseVisa(all):PDFParser.parseMC(all);if(!gastos.length){showToast('Sin gastos en PDF',true);setParsing(false);return;}let rate=usdRate;if(gastos.some(g=>g.isUSD)&&!rate){try{rate=await dolarService.getOficialRate();setUsdRate(rate);}catch{}}const existing=transactions.filter(t=>t.type==='expense');const wm=gastos.map(g=>{const isDup=existing.some(t=>{if(!PDFParser.nameMatch(g.nombre,t.item_name))return false;const sameAmt=g.isUSD?t.usd_amount===g.monto:t.amount_cents===g.monto;return sameAmt;});const mARS=g.isUSD&&rate?Math.round(g.monto*rate):g.isUSD?0:g.monto;return{...g,selected:!isDup,isDup,montoARS:mARS,rateUsed:rate||0,rubro:detectRubro(g.nombre,g.isUSD)};});setParsed(wm);}catch(e){console.error(e);showToast('Error PDF',true);}setParsing(false);};

  const toggle=(idx)=>setParsed(p=>p.map((g,i)=>i===idx?{...g,selected:!g.selected}:g));
  const updateRubro=(idx,rubro)=>setParsed(p=>p.map((g,i)=>i===idx?{...g,rubro}:g));
  const updateNombre=(idx,nombre)=>setParsed(p=>p.map((g,i)=>i===idx?{...g,nombre:nombre.toUpperCase()}:g));
  const expCats=categories.filter(c=>c.type==='expense');
  const [editingIdx,setEditingIdx]=useState(null);
  const [editingName,setEditingName]=useState('');

  const doImport=async()=>{const sel=parsed.filter(g=>g.selected);if(!sel.length)return;setImporting(true);let c=0;for(const g of sel){let cuotas=1,mpc,startMes=targetMonth;if(g.cuotaTotal>0&&g.cuotaActual>0){const firstMonth=targetMonth-(g.cuotaActual-1);startMes=Math.max(1,firstMonth);const skipped=startMes-firstMonth;cuotas=g.cuotaTotal-skipped;mpc=g.isUSD?g.montoARS:g.monto;}else{mpc=g.isUSD?g.montoARS:g.monto;}const cat=categories.find(x=>x.name===g.rubro&&x.type==='expense');await add({item_name:g.nombre,category_id:cat?.id||null,section:g.tarjeta,amount:mpc,cuotas,start_month:startMes,destino:'tarjeta',usd_amount:g.isUSD?g.monto:null,usd_rate:g.isUSD?g.rateUsed:null});c++;}showToast(`✓ ${c} gastos importados`);setTimeout(()=>{setParsed(null);setFileName('');setImporting(false);if(fileRef.current)fileRef.current.value='';},2000);};

  const selC=parsed?parsed.filter(g=>g.selected).length:0;
  const selT=parsed?parsed.filter(g=>g.selected).reduce((s,g)=>s+(g.isUSD?g.montoARS:g.monto),0):0;

  return (
    <div style={{ padding:'0 16px',maxWidth:650,margin:'0 auto' }}>
      <ST color="#60a8f0">Importar Resumen de Tarjeta</ST>
      <p style={{ fontSize:11,color:'#5c5c72',marginBottom:16,lineHeight:1.5 }}>Subí el PDF del resumen de Galicia (Visa o Mastercard).</p>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap',maxWidth:620 }}>
        <div style={{ flex:1,minWidth:140 }}><Sel label="Tarjeta" value={card} onChange={setCard} options={[{v:'',l:'Seleccionar...'},{v:'VISA',l:'Visa Galicia'},{v:'MASTERCARD',l:'Mastercard Galicia'}]} /></div>
        <div style={{ flex:1,minWidth:140 }}><Sel label="Mes de imputación" value={targetMonth} onChange={v=>setTargetMonth(Number(v))} options={MONTHS.map((l,i)=>({v:i+1,l}))} /></div>
      </div>
      <div onClick={()=>card&&fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
        style={{ border:'2px dashed rgba(255,255,255,0.1)',borderRadius:14,padding:'30px 20px',textAlign:'center',cursor:card?'pointer':'not-allowed',marginBottom:16,background:fileName?'rgba(96,168,240,0.06)':'rgba(255,255,255,0.02)',opacity:card?1:0.5 }}>
        <input ref={fileRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}} />
        <div style={{ fontSize:32,marginBottom:8 }}>{fileName?'📄':'📎'}</div>
        <div style={{ fontSize:13,fontWeight:600,color:'#e8e8f0' }}>{fileName||'Tocá para seleccionar el PDF'}</div>
      </div>

      {parsing && <div style={{textAlign:'center',padding:30}}><div className="ft-spinner" /><span style={{fontSize:12,color:'#5c5c72',display:'block',marginTop:10}}>Leyendo PDF...</span></div>}

      {parsed && <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontSize:12,color:'#8888a0'}}>{selC} sel · {Mn.fmt(selT)}</span>
          <Btn color="#60a8f0" onClick={doImport} disabled={importing||!selC} style={{width:'auto',padding:'8px 20px',marginBottom:0}}>{importing?'...':'Importar '+selC}</Btn>
        </div>
        {parsed.map((g,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            {/* Área clickeable: checkbox + ícono + nombre */}
            <div onClick={()=>toggle(i)} style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0,cursor:'pointer',opacity:g.selected?1:0.35}}>
              <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${g.selected?'#60a8f0':'rgba(255,255,255,0.15)'}`,background:g.selected?'#60a8f0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',flexShrink:0}}>{g.selected&&'✓'}</div>
              <ItemPreview nombre={g.nombre} rubro={g.rubro} />
              <div style={{minWidth:0,flex:1}}>
                {editingIdx===i ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={e=>setEditingName(e.target.value.toUpperCase())}
                    onKeyDown={e=>{if(e.key==='Enter'){updateNombre(i,editingName);setEditingIdx(null);}if(e.key==='Escape')setEditingIdx(null);}}
                    onBlur={()=>{updateNombre(i,editingName);setEditingIdx(null);}}
                    onClick={e=>e.stopPropagation()}
                    style={{width:'100%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(96,168,240,0.4)',borderRadius:6,padding:'3px 7px',fontSize:13,fontWeight:600,color:'#e8e8f0',outline:'none',boxSizing:'border-box'}}
                  />
                ) : (
                  <div style={{fontSize:13,fontWeight:600,color:'#e8e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.nombre}</div>
                )}
                <div style={{fontSize:10,color:'#5c5c72',marginTop:2}}>{g.isUSD?`USD ${g.monto} → ${Mn.fmt(g.montoARS)}`:Mn.fmt(g.monto)}{g.cuotaTotal>0&&` · ${g.cuotaActual}/${g.cuotaTotal}`}{g.isDup&&' · ⚠️ Dup'}</div>
              </div>
            </div>
            {/* Botón editar nombre */}
            <button onClick={e=>{e.stopPropagation();setEditingIdx(i);setEditingName(g.nombre);}} style={{background:'none',border:'none',color:'#5c5c72',fontSize:13,cursor:'pointer',padding:'2px 4px',flexShrink:0,opacity:0.6}} title="Editar nombre">✏️</button>
            {/* Selector de rubro — no propaga el toggle */}
            <select
              value={g.rubro}
              onChange={e=>{e.stopPropagation();updateRubro(i,e.target.value);}}
              onClick={e=>e.stopPropagation()}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:7,color:'#a0a0b8',fontSize:10,fontWeight:600,padding:'4px 6px',cursor:'pointer',flexShrink:0,maxWidth:110,outline:'none'}}
            >
              {expCats.map(c=><option key={c.id} value={c.name}>{c.icon||RUBRO_EMOJI[c.name]||'📎'} {c.name}</option>)}
            </select>
          </div>
        ))}
      </div>}
      <div style={{height:80}} />
    </div>
  );
}
