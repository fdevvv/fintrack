export const PDFParser = {
  extractLines(content) {
    if (!content.items?.length) return [];
    const map = {};
    content.items.forEach(it => { const y=Math.round(it.transform[5]); if(!map[y])map[y]=[]; map[y].push({x:it.transform[4],t:it.str}); });
    return Object.keys(map).map(Number).sort((a,b)=>b-a).map(y=>map[y].sort((a,b)=>a.x-b.x).map(p=>p.t).join(' ').replace(/\s+/g,' ').trim());
  },
  parseAmt(s) { return Math.round(parseFloat(s.replace(/\./g,'').replace(',','.'))); },
  nameMatch(a,b) { a=(a||'').toUpperCase().replace(/[^A-Z0-9]/g,''); b=(b||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(!a||!b||a.length<3||b.length<3)return false; return a===b||a.includes(b)||b.includes(a)||a.slice(0,6)===b.slice(0,6); },
  parseGeneric(lines) {
    const g=[]; const mR=/([\d.]+,\d{2})\s*$/;
    const skip=['TOTAL','SUBTOTAL','SALDO','PAGO','IMPUESTO','VENCIMIENTO','IVA','I.V.A','PERCEP','IIBB','SELLOS','FECHA','TARJETA','APERTURA','CIERRE','PERIODO','RESUMEN','DISPONIBLE','LIMITE','INTERES','FINANCIERO','RECARGO','$'];
    for(const line of lines){const l=line.trim();if(l.length<5)continue;if(skip.some(s=>l.toUpperCase().includes(s)))continue;const mm=mR.exec(l);if(!mm)continue;const mt=this.parseAmt(mm[1]);if(mt<200)continue;let ref=l.replace(mR,'').trim();ref=ref.replace(/^\d{4}[\/-]\d{2}[\/-]\d{2}\s*/,'').replace(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\s*/,'').replace(/^\d{1,2}[\/-][A-Za-zÁÉÍÓÚ]{3}[\/-]\d{2,4}\s*/i,'');ref=ref.replace(/\b\d{6,}\b/g,'').replace(/[*/\\]/g,' ').replace(/\s+/g,' ').trim();if(!ref||ref.length<3)continue;g.push({nombre:ref.toUpperCase(),monto:mt,cuotaActual:0,cuotaTotal:0,tarjeta:'TARJETA',isUSD:false});}
    return g;
  },
  // Parsea cargos bancarios / impuestos del resumen (funciona para cualquier banco).
  // Los cargos siempre tienen prefijo de fecha y nombre de impuesto reconocible.
  parseTaxLines(lines) {
    const g=[]; const mR=/([\d.]+,\d{2})\s*$/;
    const dateR=/^\d{2}[-\/][\dA-Za-z]{2,3}[-\/]\d{2,4}/i;
    // Orden importa: más específico primero para evitar match parcial
    const taxK=[
      ['IMPUESTO DE SELLOS P','IMPUESTO SELLOS PROV.'],
      ['IMPUESTO DE SELLOS','IMPUESTO DE SELLOS'],
      ['INTERESES FINANC','INTERESES FINANCIACION'],
      ['IVA SOBRE INTERESES','IVA S/INTERESES'],
      ['DB IVA','IVA S/INTERESES'],
      ['IVA RG','PERCEPCION IVA RG'],
      ['PERCEP.*IVA','PERCEPCION IVA RG'],
      ['IIBB','PERCEPCION IIBB'],
      ['DB.RG','PERCEPCION RG'],
      ['PERCEP.*RG','PERCEPCION RG'],
      ['RECARGO FINANC','RECARGO FINANCIERO'],
      ['COSTO FINANC','COSTO FINANCIERO'],
    ];
    for(const line of lines){const l=line.trim();const lu=l.toUpperCase();if(!dateR.test(l))continue;const match=taxK.find(([k])=>new RegExp(k).test(lu));if(!match)continue;const mm=mR.exec(l);if(!mm)continue;const mt=this.parseAmt(mm[1]);if(mt<100)continue;g.push({nombre:match[1],monto:mt,cuotaActual:0,cuotaTotal:0,tarjeta:'TARJETA',isUSD:false,isTax:true});}
    return g;
  },
  autoParse(lines) {
    const visa=this.parseVisa(lines);
    const mc=this.parseMC(lines);
    const generic=this.parseGeneric(lines);
    const taxes=this.parseTaxLines(lines);
    let base;
    if(visa.length>=mc.length&&visa.length>=generic.length)base=visa;
    else if(mc.length>=visa.length&&mc.length>=generic.length)base=mc;
    else base=generic;
    return [...base,...taxes];
  },
  parseVisa(lines) {
    const g=[]; let inD=false; let lastDateStr='';
    const dR=/^(\d{2})-(\d{2})-(\d{2})/,cR=/\s(\d{2})\/(\d{2})(?:\s|$)/,mR=/([\d.]+,\d{2})\s*$/;
    const sk=['FECHA','TARJETA 4','TOTAL A PAGAR','IMPUESTO','IIBB','IVA','I.V.A','PERCEP','DB.RG','DEV.IMP','SALDO ANTERIOR','SU PAGO','LIMITE','DISPONIBLE','INTERES','FINANCIERO','RECARGO','COSTO FINANC','$'];
    for(const line of lines){const l=line.trim();const lu=l.toUpperCase();if(/DETALLE DEL CONSUMO|MONEDA EXTRANJERA|CONSUMOS EN MONEDA|EN DOLARES/.test(lu)){inD=true;continue;}if(/Plan V:|Cuotas a vencer/.test(l)){inD=false;continue;}if(!inD||sk.some(s=>lu.includes(s)))continue;const dm=dR.exec(l);if(dm)lastDateStr=dm[0];if(!dm&&!lastDateStr)continue;const isU=/USD/.test(lu);const mm=mR.exec(l);if(!mm)continue;const mt=isU?parseFloat(mm[1].replace(/\./g,'').replace(',','.')):this.parseAmt(mm[1]);if((isU&&mt<=0)||(!isU&&mt<100))continue;const lineBody=dm?l.substring(dm[0].length).trim():l;let af=lineBody.replace(/^[*KFE]\s+/,'').replace(/^\d+\*/,'').replace(/^[A-Z]+\*/i,'');const cm=cR.exec(af);let cA=0,cT=0;if(cm){cA=parseInt(cm[1]);cT=parseInt(cm[2]);af=af.substring(0,cm.index)+af.substring(cm.index+cm[0].length);}let ref=af.replace(/\b\d{4,}\b/g,'').replace(mR,'').replace(/\/\s*/g,' ').replace(/\s+/g,' ').trim();if(isU)ref=ref.replace(/\b[A-Z0-9]*USD\b/gi,'').replace(/([\d.]+,\d{2})/g,'').replace(/\s+/g,' ').trim();if(!ref||ref.length<2)continue;g.push({nombre:ref.toUpperCase(),monto:mt,cuotaActual:cA,cuotaTotal:cT,tarjeta:'VISA',isUSD:isU});}return g;
  },
  parseMC(lines) {
    const g=[]; let inD=false; let lastDateStr='';
    const dR=/^(\d{2})-([A-Za-z]{3})-(\d{2})/,cR=/\s(\d{2})\/(\d{2})(?:\s|$)/,mR=/([\d.]+,\d{2})\s*$/;
    const sk=['SUBTOTAL','TOTAL A PAGAR','IMPUESTO','IVA','I.V.A','IIBB','PERCEP','SALDO ANTERIOR','SU PAGO','SALDO PENDIENTE','TOTAL CONSUMOS','LIMITE','DISPONIBLE','INTERES','FINANCIERO','RECARGO','COSTO FINANC','$'];
    for(const line of lines){const l=line.trim();const lu=l.toUpperCase();if(/DETALLE DEL CONSUMO|MONEDA EXTRANJERA|CONSUMOS EN MONEDA|EN DOLARES/.test(lu)){inD=true;continue;}if(/Cuotas a vencer|OPCIONES DE FINANCIACION/.test(l)){inD=false;continue;}if(!inD||sk.some(s=>lu.includes(s)))continue;const dm=dR.exec(l);if(dm)lastDateStr=dm[0];if(!dm&&!lastDateStr)continue;const isU=/USD/.test(l);const mm=mR.exec(l);if(!mm)continue;const mt=isU?parseFloat(mm[1].replace(/\./g,'').replace(',','.')):this.parseAmt(mm[1]);if((isU&&mt<=0)||(!isU&&mt<100))continue;const lineBody=dm?l.substring(dm[0].length).trim():l;let af=lineBody;const cm=cR.exec(af);let cA=0,cT=0;if(cm){cA=parseInt(cm[1]);cT=parseInt(cm[2]);af=af.substring(0,cm.index)+af.substring(cm.index+cm[0].length);}af=af.replace(/^[A-Z]+\*/i,'');let ref=af.replace(/\b\d{4,}\b/g,'').replace(mR,'').replace(/\/\s*/g,' ').replace(/\s+/g,' ').trim();if(isU)ref=ref.replace(/\b[A-Z0-9]*USD\b/gi,'').replace(/([\d.]+,\d{2})/g,'').replace(/\s+/g,' ').trim();if(!ref||ref.length<2)continue;g.push({nombre:ref.toUpperCase(),monto:mt,cuotaActual:cA,cuotaTotal:cT,tarjeta:'MASTERCARD',isUSD:isU});}return g;
  },
};
