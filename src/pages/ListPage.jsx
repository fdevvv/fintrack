import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { MONTHS, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { exportToExcel } from '@/services/export.service';
import { useTransactions } from '@/hooks/transactions/useTransactions';
import { useDeleteTransaction } from '@/hooks/transactions/useDeleteTransaction';
import { ST, MonthBar, ItemIcon, SectionTag, CuotaTag, ConfirmModal } from '@/components/ui/Shared';

export function ListPage() {
  const { month, setMonth, income, year } = useStore();
  const { showToast } = useUiStore();
  const [search, setSearch] = useState('');
  const [filterRub, setFilterRub] = useState('');
  const [filterSec, setFilterSec] = useState('');
  const [delTarget, setDelTarget] = useState(null);

  const { filtered, grouped, total, rubrosInData, secsInData } = useTransactions({ month, search, filterRub, filterSec });
  const { remove } = useDeleteTransaction();

  const handleDelete = async () => {
    if (!delTarget) return;
    try { await remove(delTarget.id, delTarget.installment_group_id); showToast('✓ Eliminado'); }
    catch { showToast('Error', true); }
    setDelTarget(null);
  };

  const chip = (active, color) => ({ padding:'5px 10px',borderRadius:16,border:'none',fontSize:10,fontWeight:600,background:active?(color||'#7c6cf0'):'rgba(255,255,255,0.05)',color:active?'#fff':'#6c6c84',cursor:'pointer',whiteSpace:'nowrap' });
  let lastRubro = '';

  return (
    <div style={{ padding:'0 16px',maxWidth:800,margin:'0 auto' }}>
      <ST color="#7c6cf0">Detalle de Gastos</ST>
      <div style={{ position:'relative',marginBottom:10,maxWidth:500 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar gasto..." style={{ width:'100%',padding:'11px 14px',fontSize:13,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',outline:'none',boxSizing:'border-box' }} />
        {search && <button onClick={()=>setSearch('')} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#5c5c72',fontSize:16,cursor:'pointer' }}>✕</button>}
      </div>

      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:6 }}>
        <button onClick={()=>setFilterSec('')} style={chip(!filterSec)}>Todas</button>
        {secsInData.map(s => <button key={s} onClick={()=>setFilterSec(filterSec===s?'':s)} style={chip(filterSec===s,SECTIONS[s]?.color)}>{SECTIONS[s]?.short||s}</button>)}
      </div>
      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>
        <button onClick={()=>setFilterRub('')} style={{ ...chip(!filterRub),background:!filterRub?'rgba(45,212,168,0.15)':'rgba(255,255,255,0.05)',color:!filterRub?'#2dd4a8':'#6c6c84' }}>Todos rubros</button>
        {rubrosInData.map(r => <button key={r} onClick={()=>setFilterRub(filterRub===r?'':r)} style={{ ...chip(filterRub===r),background:filterRub===r?'rgba(45,212,168,0.15)':'rgba(255,255,255,0.05)',color:filterRub===r?'#2dd4a8':'#6c6c84' }}>{RUBRO_EMOJI[r]||'📎'} {r}</button>)}
      </div>

      <MonthBar sel={month} onSel={setMonth} />

      {grouped.length===0 ? (
        <div style={{ textAlign:'center',padding:40,color:'#5c5c72',fontSize:14 }}>Sin gastos{month>=0?` en ${MONTHS[month]}`:''}</div>
      ) : (
        <div>
          {grouped.map((g,i) => {
            const catName=g.categories?.name||'Otros';
            const showHeader=catName!==lastRubro; lastRubro=catName;
            const cur = month>=0 ? (g.items.find(t=>new Date(t.transaction_date).getMonth()===month)||g.items[0]) : g.items[0];
            const amt = month===-1 ? g.totalAmount : cur.amount_cents;
            const iT = g.maxInstallmentTotal;
            return (
              <div key={`${g.item_name}-${g.section}-${i}`}>
                {showHeader && <div style={{ padding:'10px 0 6px',marginTop:i>0?8:0,borderBottom:'1px solid rgba(255,255,255,0.05)' }}><span style={{ fontSize:12,fontWeight:700,color:'#6c6c84' }}>{RUBRO_EMOJI[catName]||'📎'} {catName}</span></div>}
                <div style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <ItemIcon item={g} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:'#e8e8f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{g.item_name||g.description}</div>
                    <div style={{ display:'flex',gap:6,alignItems:'center',marginTop:4,flexWrap:'wrap' }}>
                      <SectionTag section={g.section} />
                      {iT>1 && (month===-1 ? <CuotaTag current={g.items.length} total={iT} /> : <CuotaTag current={cur.installment_current} total={iT} />)}
                      {month===-1 && iT>1 && <span style={{ fontSize:9,color:'#5c5c72' }}>{Mn.fmt(cur.amount_cents)}/mes</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:15,fontWeight:700,color:'#e8e8f0',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap' }}>{Mn.fmt(amt)}</div>
                  <button onClick={()=>setDelTarget(cur)} style={{ background:'none',border:'none',color:'#f06070',fontSize:16,cursor:'pointer',padding:'4px',flexShrink:0,opacity:0.6 }}>🗑</button>
                </div>
              </div>
            );
          })}
          <div style={{ display:'flex',justifyContent:'space-between',padding:'16px 0 4px',borderTop:'2px solid rgba(255,255,255,0.08)',marginTop:10 }}>
            <span style={{ fontSize:13,fontWeight:600,color:'#8888a0' }}>Total ({grouped.length} items)</span>
            <span style={{ fontSize:16,fontWeight:800,color:'#fff' }}>{Mn.fmt(total)}</span>
          </div>
        </div>
      )}

      {/* Export */}
      {filtered.length > 0 && (
        <button onClick={async () => {
          try { await exportToExcel(filtered, income, year); showToast('✓ Excel descargado'); }
          catch (e) { showToast('Error: ' + e.message, true); }
        }} style={{ width:'100%',padding:'10px',borderRadius:10,border:'1px solid rgba(45,212,168,0.2)',background:'rgba(45,212,168,0.06)',color:'#2dd4a8',fontSize:12,fontWeight:600,cursor:'pointer',marginTop:8 }}>
          📊 Exportar Detalle a Excel
        </button>
      )}

      <ConfirmModal show={!!delTarget} title="Eliminar gasto" message={delTarget?`¿Eliminar "${delTarget.item_name}"?${(delTarget.installment_total||1)>1?' Se eliminan todas las cuotas.':''}`:''} onConfirm={handleDelete} onCancel={()=>setDelTarget(null)} />
      <div style={{ height:80 }} />
    </div>
  );
}
