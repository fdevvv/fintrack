import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { RUBRO_EMOJI, getSubIcon } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { dolarService } from '@/services/dolar.service';
import { useAddTransaction } from '@/hooks/transactions/useAddTransaction';
import { ST, Sel, Btn } from '@/components/ui/Shared';
import { PDFParser } from '@/utils/pdfParser';

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
    if (svg) return <div style={{width:30,height:30,borderRadius:7,overflow:'hidden',flexShrink:0}} dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <div style={{width:30,height:30,borderRadius:7,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
      {RUBRO_EMOJI[rubro] || '📎'}
    </div>
  );
}

export function ImportPage() {
  const { year, transactions, categories, userSections, addSection } = useStore();
  const { showToast } = useUiStore();
  const { add } = useAddTransaction();
  const [sectionKey,setSectionKey]=useState('');
  const [showNewSec,setShowNewSec]=useState(false);const [newSecName,setNewSecName]=useState('');
  const [fileName,setFileName]=useState('');const [parsing,setParsing]=useState(false);
  const [parsed,setParsed]=useState(null);const [usdRate,setUsdRate]=useState(null);const [importing,setImporting]=useState(false);
  const [pdfReady,setPdfReady]=useState(!!window.pdfjsLib);const fileRef=useRef(null);
  const [targetMonth,setTargetMonth]=useState(new Date().getMonth()+1);

  const handleCreateSection = async () => {
    const name = newSecName.trim();
    if (!name) return;
    const key = name.toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,'');
    try {
      await addSection(key, name, true);
      setSectionKey(key);
      setNewSecName('');
      setShowNewSec(false);
      showToast(`✓ "${name}" creada`);
    } catch (e) { showToast(e.message || 'Error', true); }
  };

  useEffect(()=>{if(window.pdfjsLib){setPdfReady(true);return;}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';setPdfReady(true);};document.head.appendChild(s);},[]);

  const handleFile=async(file)=>{if(!sectionKey){showToast('Seleccioná tarjeta',true);return;}if(!file||file.type!=='application/pdf'){showToast('Solo PDF',true);return;}setFileName(file.name);setParsed(null);setParsing(true);let att=0;while(!window.pdfjsLib&&att<20){await new Promise(r=>setTimeout(r,300));att++;}if(!window.pdfjsLib){showToast('Error PDF',true);setParsing(false);return;}try{const buf=await file.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;let all=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();all=all.concat(PDFParser.extractLines(c));}const gastos=PDFParser.autoParse(all);if(!gastos.length){showToast('Sin gastos en PDF',true);setParsing(false);return;}let rate=usdRate;if(gastos.some(g=>g.isUSD)&&!rate){try{rate=await dolarService.getOficialRate();setUsdRate(rate);}catch{}}const existing=transactions.filter(t=>t.type==='expense');const wm=gastos.map(g=>{const isDup=existing.some(t=>{if(!PDFParser.nameMatch(g.nombre,t.item_name))return false;const sameAmt=g.isUSD?t.usd_amount===g.monto:t.amount_cents===g.monto;return sameAmt;});const mARS=g.isUSD&&rate?Math.round(g.monto*rate):g.isUSD?0:g.monto;return{...g,selected:!isDup,isDup,montoARS:mARS,rateUsed:rate||0,rubro:detectRubro(g.nombre,g.isUSD)};});setParsed(wm);}catch(e){console.error(e);showToast('Error PDF',true);}setParsing(false);};

  const toggle=(idx)=>setParsed(p=>p.map((g,i)=>i===idx?{...g,selected:!g.selected}:g));
  const updateRubro=(idx,rubro)=>setParsed(p=>p.map((g,i)=>i===idx?{...g,rubro}:g));
  const updateNombre=(idx,nombre)=>setParsed(p=>p.map((g,i)=>i===idx?{...g,nombre:nombre.toUpperCase()}:g));
  const expCats=categories.filter(c=>c.type==='expense');
  const [editingIdx,setEditingIdx]=useState(null);
  const [editingName,setEditingName]=useState('');

  const doImport=async()=>{const sel=parsed.filter(g=>g.selected);if(!sel.length)return;setImporting(true);let c=0;for(const g of sel){let cuotas=1,mpc,startMes=targetMonth;if(g.cuotaTotal>0&&g.cuotaActual>0){const firstMonth=targetMonth-(g.cuotaActual-1);startMes=Math.max(1,firstMonth);const skipped=startMes-firstMonth;cuotas=g.cuotaTotal-skipped;mpc=g.isUSD?g.montoARS:g.monto;}else{mpc=g.isUSD?g.montoARS:g.monto;}const cat=categories.find(x=>x.name===g.rubro&&x.type==='expense');await add({item_name:g.nombre,category_id:cat?.id||null,section:sectionKey,amount:mpc,cuotas,start_month:startMes,destino:'tarjeta',usd_amount:g.isUSD?g.monto:null,usd_rate:g.isUSD?g.rateUsed:null});c++;}showToast(`✓ ${c} gastos importados`);setTimeout(()=>{setParsed(null);setFileName('');setImporting(false);if(fileRef.current)fileRef.current.value='';},2000);};

  const selC=parsed?parsed.filter(g=>g.selected).length:0;
  const selT=parsed?parsed.filter(g=>g.selected).reduce((s,g)=>s+(g.isUSD?g.montoARS:g.monto),0):0;

  return (
    <div style={{ padding:'0 16px',maxWidth:650,margin:'0 auto' }}>
      <ST color="#60a8f0">Importar Resumen de Tarjeta</ST>
      <p style={{ fontSize:11,color:'#5c5c72',marginBottom:16,lineHeight:1.5 }}>Subí el PDF del resumen de tu tarjeta.</p>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap',maxWidth:620 }}>
        <div style={{ flex:1,minWidth:140 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c6c84',marginBottom:5 }}>Tarjeta</label>
          <select value={sectionKey} onChange={e=>{ if(e.target.value==='__new__'){setShowNewSec(true);}else{setSectionKey(e.target.value);setShowNewSec(false);} }}
            style={{ width:'100%',padding:'11px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,outline:'none',boxSizing:'border-box',appearance:'none',WebkitAppearance:'none' }}>
            <option value="">{userSections.filter(s=>s.is_card).length?'Seleccionar...':'Sin tarjetas'}</option>
            {userSections.filter(s=>s.is_card).map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            <option value="__new__">＋ Nueva tarjeta</option>
          </select>
          {showNewSec && (
            <div style={{ display:'flex',gap:6,marginTop:6,alignItems:'center' }}>
              <input value={newSecName} onChange={e=>setNewSecName(e.target.value)} placeholder="Ej: Naranja X" autoFocus
                onKeyDown={e=>e.key==='Enter'&&handleCreateSection()}
                style={{ flex:1,padding:'7px 10px',borderRadius:8,border:'1px solid rgba(124,108,240,0.3)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,outline:'none' }}
              />
              <button type="button" onClick={handleCreateSection} style={{ padding:'7px 12px',borderRadius:8,border:'none',background:'#7c6cf0',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer' }}>Crear</button>
            </div>
          )}
        </div>
        <div style={{ flex:1,minWidth:140 }}><Sel label="Mes de imputación" value={targetMonth} onChange={v=>setTargetMonth(Number(v))} options={MONTHS.map((l,i)=>({v:i+1,l}))} /></div>
      </div>
      <div onClick={()=>sectionKey&&fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
        style={{ border:'2px dashed rgba(255,255,255,0.1)',borderRadius:14,padding:'30px 20px',textAlign:'center',cursor:sectionKey?'pointer':'not-allowed',marginBottom:16,background:fileName?'rgba(96,168,240,0.06)':'rgba(255,255,255,0.02)',opacity:sectionKey?1:0.5 }}>
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
                    style={{width:'100%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(96,168,240,0.4)',borderRadius:6,padding:'3px 7px',fontSize:16,fontWeight:600,color:'#e8e8f0',outline:'none',boxSizing:'border-box'}}
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
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:7,color:'#a0a0b8',fontSize:16,fontWeight:600,padding:'4px 6px',cursor:'pointer',flexShrink:0,maxWidth:110,outline:'none'}}
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
