import { useMemo, useState } from 'react';
import { useStore } from '@/stores/useStore';
import { MONTHS, RUBRO_EMOJI, COLORS } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { cardStyle, tooltipStyle, tooltipLabel, tooltipItem, tooltipWrapper, tooltipCursor } from '@/utils/styles';
import { exportToExcel } from '@/services/export';
import { ST, MonthBar, ItemIcon, Pnl, ConfirmModal } from '@/components/ui/Shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const METHODS = { cash:'Efectivo', transfer:'Transferencia', qr_debit:'QR Débito', debit_card:'Débito' };

export function GastosPage() {
  const { transactions, income, deleteTransaction, showToast } = useStore();
  const [filterMethod, setFilterMethod] = useState('');
  const [localMonth, setLocalMonth] = useState(new Date().getMonth());
  const [delTarget, setDelTarget] = useState(null);

  // Only manual daily expenses
  const gastos = useMemo(() =>
    transactions.filter(t =>
      t.type === 'expense' &&
      t.source === 'manual'
    ),
  [transactions]);

  const filtered = useMemo(() => {
    let f = gastos;
    if (localMonth >= 0) f = f.filter(t => new Date(t.transaction_date).getMonth() === localMonth);
    if (filterMethod) f = f.filter(t => t.payment_method === filterMethod);
    return f.sort((a,b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  }, [gastos, localMonth, filterMethod]);

  const total = filtered.reduce((s,t) => s + t.amount_cents, 0);

  // Category breakdown for pie
  const catData = useMemo(() => {
    const m = {};
    filtered.forEach(t => { const r = t.categories?.name||'Otros'; m[r]=(m[r]||0)+t.amount_cents; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}));
  }, [filtered]);

  // Monthly comparison by category (bar chart)
  const compData = useMemo(() => {
    const mo = localMonth >= 0 ? localMonth : new Date().getMonth();
    const prev = mo === 0 ? 11 : mo - 1;
    const curMonth = {}, prevMonth = {};
    gastos.forEach(t => {
      const m = new Date(t.transaction_date).getMonth();
      const cat = t.categories?.name || 'Otros';
      if (m === mo) curMonth[cat] = (curMonth[cat]||0) + t.amount_cents;
      if (m === prev) prevMonth[cat] = (prevMonth[cat]||0) + t.amount_cents;
    });
    const allCats = [...new Set([...Object.keys(curMonth), ...Object.keys(prevMonth)])];
    return allCats.map(cat => ({ name:cat, [MONTHS[mo]]:curMonth[cat]||0, [MONTHS[prev]]:prevMonth[cat]||0 })).sort((a,b) => (b[MONTHS[mo]]||0) - (a[MONTHS[mo]]||0));
  }, [gastos, localMonth]);

  const ttS = tooltipStyle;
  const chip = (active,c) => ({ padding:'5px 10px',borderRadius:16,border:'none',fontSize:10,fontWeight:600,background:active?(c||'#7c6cf0'):'rgba(255,255,255,0.05)',color:active?'#fff':'#6c6c84',cursor:'pointer',whiteSpace:'nowrap' });

  return (
    <div style={{ padding:'0 16px',maxWidth:900,margin:'0 auto' }}>
      <ST color="#2dd4a8">Gastos del Mes</ST>
      <p style={{ fontSize:11,color:'#5c5c72',marginBottom:12 }}>Efectivo, transferencia, QR y débito</p>

      {/* Method filter */}
      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>
        <button onClick={()=>setFilterMethod('')} style={chip(!filterMethod,'#2dd4a8')}>Todos</button>
        {Object.entries(METHODS).map(([k,v]) => (
          <button key={k} onClick={()=>setFilterMethod(filterMethod===k?'':k)} style={chip(filterMethod===k,'#2dd4a8')}>{v}</button>
        ))}
      </div>

      <MonthBar sel={localMonth} onSel={setLocalMonth} />

      {/* Summary cards */}
      {(() => {
        const inc = income[localMonth >= 0 ? localMonth : new Date().getMonth()] || 0;
        const rest = inc - total;
        const AmtCell = ({ label, value, color, sub }) => {
          const [expanded, setExpanded] = useState(false);
          return (
            <div style={cardStyle} onClick={() => setExpanded(!expanded)} title={Mn.fmt(value)}>
              <div style={{ fontSize:10,color:'#6c6c84',fontWeight:600,textTransform:'uppercase' }}>{label}</div>
              <div style={{ fontSize:expanded?15:18,fontWeight:800,color,marginTop:2,cursor:'pointer',transition:'font-size .15s' }}>{value===0&&label==='Ingreso'?'—':expanded?Mn.fmt(value):Mn.short(value)}</div>
              {sub && <div style={{ fontSize:9,color:'#5c5c72' }}>{sub}</div>}
            </div>
          );
        };
        return (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
            <AmtCell label="Ingreso" value={inc} color="#2dd4a8" />
            <AmtCell label="Gastado" value={total} color="#f06070" sub={`${filtered.length} gastos`} />
            <AmtCell label="Restante" value={rest} color={rest>=0?'#2dd4a8':'#f06070'} sub={rest>=0?'Disponible':'Déficit'} />
          </div>
        );
      })()}

      {/* Charts row */}
      <style>{`
        .gastos-charts { display:flex; flex-direction:column; gap:14px; }
        @media (min-width:768px) { .gastos-charts { display:grid; grid-template-columns:1fr 1fr; } }
      `}</style>
      <div className="gastos-charts">
        {catData.length > 0 && (
          <Pnl title="Por categoría">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none">
                  {catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={ttS} labelStyle={tooltipLabel} itemStyle={tooltipItem} wrapperStyle={tooltipWrapper} cursor={tooltipCursor} formatter={(v,name)=>[Mn.fmt(v),name]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex',flexWrap:'wrap',gap:'4px 10px',justifyContent:'center',marginTop:4 }}>
              {catData.slice(0,8).map((r,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:4,fontSize:9,color:'#a0a0b8' }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length] }} />{r.name}
                </div>
              ))}
            </div>
          </Pnl>
        )}

        {compData.length > 0 && (
          <Pnl title="Comparación mensual">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compData.slice(0,6)} margin={{top:0,right:0,left:-10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{fill:'#8888a0',fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#8888a0',fontSize:9}} axisLine={false} tickLine={false} tickFormatter={Mn.short} />
                <Tooltip contentStyle={ttS} labelStyle={tooltipLabel} itemStyle={tooltipItem} wrapperStyle={tooltipWrapper} cursor={tooltipCursor} formatter={(v,name)=>[Mn.fmt(v),name]} />
                <Bar dataKey={MONTHS[localMonth>=0?localMonth:new Date().getMonth()]} fill="#2dd4a8" radius={[4,4,0,0]} />
                <Bar dataKey={MONTHS[(localMonth>=0?localMonth:new Date().getMonth())===0?11:(localMonth>=0?localMonth:new Date().getMonth())-1]} fill="rgba(45,212,168,0.3)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Pnl>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'40px 20px',color:'#5c5c72' }}>
          <div style={{ fontSize:32,marginBottom:10 }}>💵</div>
          <div style={{ fontSize:14,fontWeight:600,color:'#8888a0',marginBottom:6 }}>Sin gastos manuales este mes</div>
          <div style={{ fontSize:12,lineHeight:1.5 }}>Agregá gastos en efectivo, transferencia o QR desde <span style={{ color:'#7c6cf0',fontWeight:600 }}>＋ Agregar</span></div>
        </div>
      ) : (
        <div style={{ marginTop:8 }}>
          {filtered.map((t) => (
            <div key={t.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <ItemIcon item={t} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'#e8e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.item_name||t.description||'Sin nombre'}</div>
                <div style={{ fontSize:10,color:'#5c5c72',marginTop:2 }}>
                  {METHODS[t.payment_method]||t.payment_method} · {new Date(t.transaction_date).toLocaleDateString('es-AR')}
                  {t.categories?.name && ` · ${t.categories.name}`}
                </div>
              </div>
              <div style={{ fontSize:14,fontWeight:700,color:'#e8e8f0',fontVariantNumeric:'tabular-nums' }}>{Mn.fmt(t.amount_cents)}</div>
              <button onClick={()=>setDelTarget(t)} style={{ background:'none',border:'none',color:'#f06070',fontSize:14,cursor:'pointer',padding:'4px',opacity:0.6 }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      {filtered.length > 0 && (
        <button onClick={async () => {
          try { await exportToExcel(filtered, useStore.getState().income, useStore.getState().year); showToast('✓ Excel descargado'); }
          catch (e) { showToast('Error: ' + e.message, true); }
        }} style={{ width:'100%',padding:'10px',borderRadius:10,border:'1px solid rgba(45,212,168,0.2)',background:'rgba(45,212,168,0.06)',color:'#2dd4a8',fontSize:12,fontWeight:600,cursor:'pointer',marginTop:8 }}>
          📊 Exportar Gastos del Mes a Excel
        </button>
      )}

      <ConfirmModal show={!!delTarget} title="Eliminar" message={delTarget?`¿Eliminar "${delTarget.item_name}"?`:''} onConfirm={async()=>{if(delTarget){await deleteTransaction(delTarget.id);showToast('✓ Eliminado');}setDelTarget(null);}} onCancel={()=>setDelTarget(null)} />
      <div style={{ height:80 }} />
    </div>
  );
}
