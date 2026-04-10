import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { MONTHS, RUBRO_EMOJI, COLORS } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { cardStyle, tooltipStyle, tooltipLabel, tooltipItem, tooltipWrapper, tooltipCursor } from '@/utils/styles';
import { exportToExcel } from '@/services/export.service';
import { useTransactions } from '@/hooks/transactions/useTransactions';
import { useDeleteTransaction } from '@/hooks/transactions/useDeleteTransaction';
import { useItemIcons } from '@/hooks/useItemIcons';
import { ST, MonthBar, ItemIcon, Pnl, ConfirmModal } from '@/components/ui/Shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const METHODS = { cash:'Efectivo', transfer:'Transferencia', qr_debit:'QR', debit_card:'Débito' };

function EmojiPicker({ itemName, current, onSelect, onClose }) {
  const [picker, setPicker] = useState(null);
  const isDesktop = window.innerWidth >= 640;

  useEffect(() => {
    Promise.all([
      import('@emoji-mart/react'),
      import('@emoji-mart/data'),
    ]).then(([{ default: Picker }, { default: data }]) => {
      setPicker({ Picker, data });
    });
  }, []);

  const pickerNode = picker ? (
    <picker.Picker
      data={picker.data}
      onEmojiSelect={(e) => onSelect(e.native)}
      theme="dark"
      locale="es"
      previewPosition="none"
      skinTonePosition="none"
      searchPosition="sticky"
      maxFrequentRows={2}
      perLine={isDesktop ? 9 : 8}
      set="native"
    />
  ) : (
    <div style={{ fontSize:12, color:'#5c5c72', padding:24 }}>Cargando...</div>
  );

  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px', flexShrink:0 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8e8f0' }}>Editar ícono</div>
        <div style={{ fontSize:10, color:'#5c5c72', marginTop:2 }}>{itemName}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {current && (
          <button onClick={() => onSelect(null)} style={{ fontSize:10, color:'#f06070', background:'rgba(240,96,112,0.1)', border:'1px solid rgba(240,96,112,0.2)', borderRadius:6, padding:'5px 10px', cursor:'pointer' }}>
            Restablecer
          </button>
        )}
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#6c6c84', fontSize:22, cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.5)' }} />
      {isDesktop ? (
        /* Desktop: modal centrado */
        <div style={{
          position:'fixed', zIndex:1000,
          top:'50%', left:'50%', transform:'translate(-50%, -50%)',
          background:'#13131f', borderRadius:16,
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.8)',
          overflow:'hidden',
        }}>
          {header}
          {pickerNode}
        </div>
      ) : (
        /* Mobile: bottom sheet sobre la nav bar */
        <div style={{
          position:'fixed', bottom:'calc(63px + env(safe-area-inset-bottom, 0px))', left:0, right:0, zIndex:1000,
          background:'#13131f', borderRadius:'20px 20px 0 0',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 -8px 40px rgba(0,0,0,0.5)',
          maxHeight:'70vh', display:'flex', flexDirection:'column',
        }}>
          {header}
          <div style={{ overflowY:'auto', display:'flex', justifyContent:'center' }}>{pickerNode}</div>
        </div>
      )}
    </>
  );
}

export function GastosPage() {
  const { income, year } = useStore();
  const { showToast } = useUiStore();
  const { icons, setIcon } = useItemIcons();
  const [editingIcon, setEditingIcon] = useState(null); // item_name being edited
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterMethod, setFilterMethod] = useState('');
  const [localMonth, setLocalMonth] = useState(() => {
    const m = searchParams.get('m');
    return m !== null ? Number(m) : new Date().getMonth();
  });

  const handleMonthChange = (m) => {
    setLocalMonth(m);
    const p = {};
    if (m !== new Date().getMonth()) p.m = m;
    setSearchParams(p, { replace: true });
  };
  const [delTarget, setDelTarget] = useState(null);

  const { transactions } = useStore();

  const { filtered: rawFiltered, total, catBreakdown: catData, monthComparison } = useTransactions({
    month: localMonth,
    filterMethod,
    sourceFilter: 'manual',
  });

  // Total de todos los gastos del mes (incluye importados/tarjeta)
  const totalTodos = useMemo(() => {
    const moStr = String(localMonth + 1).padStart(2, '0');
    return transactions
      .filter(t => t.type === 'expense' && t.transaction_date.slice(5, 7) === moStr)
      .reduce((s, t) => s + t.amount_cents, 0);
  }, [transactions, localMonth]);

  // Solo gastos manuales del mes (sin filtro de método — para el cálculo de Restante)
  const manualTotal = useMemo(() => {
    const moStr = String(localMonth + 1).padStart(2, '0');
    return transactions
      .filter(t => t.type === 'expense' && t.source === 'manual' && t.transaction_date.slice(5, 7) === moStr)
      .reduce((s, t) => s + t.amount_cents, 0);
  }, [transactions, localMonth]);
  const { remove } = useDeleteTransaction();

  const filtered = [...rawFiltered].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

  const { currentMonthIdx, prevMonthIdx, data: compRaw } = monthComparison;
  const compData = compRaw.map(d => ({
    name: d.name,
    [MONTHS[currentMonthIdx]]: d.current,
    [MONTHS[prevMonthIdx]]: d.previous,
  }));

  const ttS = tooltipStyle;
  const chip = (active,c) => ({ padding:'5px 10px',borderRadius:16,border:'none',fontSize:10,fontWeight:600,background:active?(c||'#7c6cf0'):'rgba(255,255,255,0.05)',color:active?'#fff':'#6c6c84',cursor:'pointer',whiteSpace:'nowrap' });

  return (
    <div style={{ padding:'0 16px',maxWidth:900,margin:'0 auto' }}>
      <ST color="#2dd4a8">Gastos del Mes</ST>
      <p style={{ fontSize:11,color:'#5c5c72',marginBottom:12 }}>Gastos del día en efectivo, transferencia, QR y débito — no incluye tarjeta de crédito</p>

      {/* Method filter */}
      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>
        <button onClick={()=>setFilterMethod('')} style={chip(!filterMethod,'#2dd4a8')}>Todos</button>
        {Object.entries(METHODS).map(([k,v]) => (
          <button key={k} onClick={()=>setFilterMethod(filterMethod===k?'':k)} style={chip(filterMethod===k,'#2dd4a8')}>{v}</button>
        ))}
      </div>

      <MonthBar sel={localMonth} onSel={handleMonthChange} />

      {/* Summary cards */}
      {(() => {
        const inc = income[localMonth >= 0 ? localMonth : new Date().getMonth()] || 0;
        const ccTotal = totalTodos - manualTotal;  // solo importados/tarjeta
        const disponible = inc - ccTotal;           // ingreso − tarjeta = disponible para el día
        const rest = disponible - manualTotal;      // lo que queda tras gastos manuales
        const cc = (c) => ({
          background: `linear-gradient(135deg, ${c}12 0%, rgba(255,255,255,0.02) 100%)`,
          borderRadius: 14, padding: '14px 16px',
          border: `1px solid ${c}30`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        });
        const AmtCell = ({ label, value, color, sub }) => {
          const [expanded, setExpanded] = useState(false);
          return (
            <div style={cc(color)} onClick={() => setExpanded(!expanded)} title={Mn.fmt(value)}>
              <div style={{ fontSize:10,color:`${color}80`,fontWeight:600,textTransform:'uppercase' }}>{label}</div>
              <div style={{ fontSize:expanded?15:18,fontWeight:800,color,marginTop:2,cursor:'pointer',transition:'font-size .15s' }}>{expanded?Mn.fmt(value):Mn.short(value)}</div>
              {sub && <div style={{ fontSize:9,color:'#5c5c72' }}>{sub}</div>}
            </div>
          );
        };
        return (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
            <AmtCell label="Disponible" value={disponible} color={disponible>=0?'#2dd4a8':'#f06070'} />
            <AmtCell label="Gastado" value={total} color="#f0a848" sub={`${filtered.length} gastos`} />
            <AmtCell label="Restante" value={rest} color={rest>=0?'#2dd4a8':'#f06070'} sub={rest>=0?'Sobrante':'Déficit'} />
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
                <Bar dataKey={MONTHS[localMonth>=0?localMonth:new Date().getMonth()]} radius={[4,4,0,0]}>
                  {compData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
                <Bar dataKey={MONTHS[(localMonth>=0?localMonth:new Date().getMonth())===0?11:(localMonth>=0?localMonth:new Date().getMonth())-1]} radius={[4,4,0,0]}>
                  {compData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]+'55'} />)}
                </Bar>
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
              <ItemIcon
                item={t}
                overrideEmoji={icons[t.item_name]}
                onClick={() => setEditingIcon(t.item_name)}
              />
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
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 4px',borderTop:'1px solid rgba(255,255,255,0.08)',marginTop:2 }}>
            <div style={{ fontSize:11,fontWeight:600,color:'#6c6c84' }}>{filtered.length} {filtered.length===1?'gasto':'gastos'}</div>
            <div style={{ fontSize:16,fontWeight:800,color:'#f0a848',fontVariantNumeric:'tabular-nums' }}>{Mn.fmt(total)}</div>
          </div>
        </div>
      )}

      {/* Export */}
      {filtered.length > 0 && (
        <button onClick={async () => {
          try { await exportToExcel(filtered, income, year); showToast('✓ Excel descargado'); }
          catch (e) { showToast('Error: ' + e.message, true); }
        }} style={{ width:'100%',padding:'10px',borderRadius:10,border:'1px solid rgba(45,212,168,0.2)',background:'rgba(45,212,168,0.06)',color:'#2dd4a8',fontSize:12,fontWeight:600,cursor:'pointer',marginTop:8 }}>
          📊 Exportar Gastos del Mes a Excel
        </button>
      )}

      {editingIcon && (
        <EmojiPicker
          itemName={editingIcon}
          current={icons[editingIcon]}
          onSelect={(emoji) => { setIcon(editingIcon, emoji); setEditingIcon(null); }}
          onClose={() => setEditingIcon(null)}
        />
      )}

      <ConfirmModal show={!!delTarget} title="Eliminar" message={delTarget?`¿Eliminar "${delTarget.item_name}"?`:''} onConfirm={async()=>{if(delTarget){await remove(delTarget.id);showToast('✓ Eliminado');}setDelTarget(null);}} onCancel={()=>setDelTarget(null)} />
      <div style={{ height:80 }} />
    </div>
  );
}
