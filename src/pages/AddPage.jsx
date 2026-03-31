import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { MONTHS_FULL, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { useAddTransaction } from '@/hooks/transactions/useAddTransaction';
import { useSyncUsd } from '@/hooks/transactions/useSyncUsd';
import { ST, Inp, Sel, Btn, Divider } from '@/components/ui/Shared';

export function AddPage() {
  const { year, years, categories, budgets, transactions, userSections, setIncome, addCategory, createYear, setBudget, addSection } = useStore();
  const { showToast } = useUiStore();
  const { add, loading: addLoading } = useAddTransaction();
  const { sync, loading: syncLoading } = useSyncUsd();
  const busy = addLoading || syncLoading;
  const [item, sI] = useState('');
  const [sec, sS] = useState('');
  const [rub, sR] = useState('');
  const [monto, sM] = useState('');
  const [cuotas, sC] = useState('1');
  const [mes, sMes] = useState(String(new Date().getMonth() + 1));
  const [moneda, setMoneda] = useState('ARS');
  const [payMethod, setPayMethod] = useState('cash');
  const [destino, setDestino] = useState('manual');
  const [ingM, sIM] = useState('');
  const [ingMes, sIMes] = useState(String(new Date().getMonth() + 1));
  const [nRub, sNR] = useState('');
  const [budRub, setBudRub] = useState('');
  const [budMonto, setBudMonto] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [showNewSec, setShowNewSec] = useState(false);

  const expenseCats = categories.filter(c => c.type === 'expense');

  // Secciones: custom del usuario (DB) + fallback legacy de transacciones existentes
  const legacySectionKeys = [...new Set(transactions.filter(t => t.section).map(t => t.section))];
  const customKeys = new Set(userSections.map(s => s.key));
  const allSections = [
    ...userSections,
    ...legacySectionKeys
      .filter(k => !customKeys.has(k))
      .map(k => ({ key: k, label: SECTIONS[k]?.label || k })),
  ];

  const handleCreateSection = async () => {
    const name = newSecName.trim();
    if (!name) return;
    const key = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    try {
      await addSection(key, name);
      sS(key);
      setNewSecName('');
      setShowNewSec(false);
      showToast(`✓ Sección "${name}" creada`);
    } catch (e) {
      showToast(e.message || 'Error al crear sección', true);
    }
  };


  const addG = async () => {
    if (!item || !rub || !monto || Number(monto) <= 0) { showToast('Completá todos los campos', true); return; }
    if (destino === 'tarjeta' && !sec) { showToast('Seleccioná la tarjeta', true); return; }
    try {
      const catObj = expenseCats.find(c => c.name === rub);
      const result = await add({
        item_name: item,
        category_id: catObj?.id || null,
        section: sec,
        amount: monto,
        cuotas,
        start_month: Number(mes),
        currency: moneda,
        payment_method: payMethod,
        destino,
      });
      showToast(moneda === 'USD' ? `✓ USD ${result.usdAmount} × $${result.usdRate} = ${Mn.fmt(result.finalMonto)}` : '✓ Gasto agregado');
      sI(''); sM('');
    } catch (err) { showToast(err.message || 'Error', true); }
  };

  const syncUSD = async () => {
    try {
      const { count, rate } = await sync();
      showToast(`✓ ${count} gastos USD actualizados · $${rate}/USD`);
    } catch { showToast('Error sync USD', true); }
  };

  return (
    <div style={{ padding: '0 16px', maxWidth: 600, margin: '0 auto' }}>
      <ST color="#7c6cf0">Agregar Gasto</ST>

      <Inp label="Nombre del gasto" value={item} onChange={sI} placeholder="Ej: NETFLIX, ZAPATILLAS" />

      {/* Destino: Mes (manual) vs Detalle (tarjeta/préstamo) */}
      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c6c84',marginBottom:5 }}>¿Dónde va este gasto?</label>
        <div style={{ display:'flex',gap:6 }}>
          {[
            { v:'manual', l:'💵 Gasto del día', c:'#2dd4a8', desc:'Efectivo, QR, débito, transferencia → Mes' },
            { v:'tarjeta', l:'💳 Tarjeta / Cuotas', c:'#7c6cf0', desc:'Visa, MC, préstamos → Detalle' },
          ].map(opt => (
            <button key={opt.v} type="button" onClick={() => setDestino(opt.v)} style={{
              flex:1,padding:'10px 12px',borderRadius:10,
              border:`1px solid ${destino===opt.v?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.06)'}`,
              background:destino===opt.v?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.02)',
              cursor:'pointer',textAlign:'left',transition:'all .15s',
            }}>
              <div style={{ fontSize:13,fontWeight:600,color:destino===opt.v?'#e8e8f0':'#8888a0' }}>{opt.l}</div>
              <div style={{ fontSize:10,color:'#5c5c72',marginTop:2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {destino === 'tarjeta' ? (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div>
              <Sel label="Sección" value={sec}
                onChange={v => { if (v === '__new__') { setShowNewSec(true); } else { sS(v); setShowNewSec(false); } }}
                options={[
                  { v:'', l: allSections.length ? 'Seleccionar...' : 'Sin secciones' },
                  ...allSections.map(s => ({ v:s.key, l:s.label })),
                  { v:'__new__', l:'＋ Agregar sección' },
                ]}
              />
              {showNewSec && (
                <div style={{ display:'flex',gap:6,marginTop:6,alignItems:'center' }}>
                  <input value={newSecName} onChange={e => setNewSecName(e.target.value)}
                    placeholder="Ej: Naranja X" autoFocus
                    onKeyDown={e => e.key==='Enter' && handleCreateSection()}
                    style={{ flex:1,padding:'7px 10px',borderRadius:8,border:'1px solid rgba(124,108,240,0.3)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,outline:'none' }}
                  />
                  <button type="button" onClick={handleCreateSection} style={{ padding:'7px 12px',borderRadius:8,border:'none',background:'#7c6cf0',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer' }}>Crear</button>
                </div>
              )}
            </div>
            <Sel label="Rubro" value={rub} onChange={sR} options={[{ v:'',l:'Seleccionar...' },...expenseCats.map(c => ({ v:c.name,l:`${RUBRO_EMOJI[c.name]||'📎'} ${c.name}` }))]} />
          </div>
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <Sel label="Método pago" value={payMethod} onChange={setPayMethod} options={[{ v:'cash',l:'Efectivo' },{ v:'qr_debit',l:'QR' },{ v:'debit_card',l:'Tarjeta débito' },{ v:'transfer',l:'Transferencia' }]} />
          <Sel label="Rubro" value={rub} onChange={sR} options={[{ v:'',l:'Seleccionar...' },...expenseCats.map(c => ({ v:c.name,l:`${RUBRO_EMOJI[c.name]||'📎'} ${c.name}` }))]} />
        </div>
      )}
      {destino === 'tarjeta' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Inp label="Monto" value={monto} onChange={sM} placeholder="0" type="number" />
          <Sel label="Moneda" value={moneda} onChange={setMoneda} options={[{ v: 'ARS', l: 'ARS $' }, { v: 'USD', l: 'USD' }]} />
          <Inp label="Cuotas" value={cuotas} onChange={sC} placeholder="1" type="number" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Inp label="Monto" value={monto} onChange={sM} placeholder="0" type="number" />
          <Sel label="Moneda" value={moneda} onChange={setMoneda} options={[{ v: 'ARS', l: 'ARS $' }, { v: 'USD', l: 'USD' }]} />
        </div>
      )}
      <Sel label="Mes" value={mes} onChange={sMes} options={MONTHS_FULL.map((m, i) => ({ v: String(i + 1), l: m }))} />
      <Btn color={destino==='manual'?'#2dd4a8':'#7c6cf0'} onClick={addG} disabled={busy}>{busy ? 'Guardando...' : moneda === 'USD' ? 'Agregar (convertir a ARS)' : destino==='manual'?'Agregar a Gastos del Mes':'Agregar a Detalle'}</Btn>
      <Btn color="rgba(255,255,255,0.08)" onClick={syncUSD} disabled={busy} style={{ color: '#f0a848' }}>🔄 Sincronizar gastos USD</Btn>

      <Divider />
      <ST color="#2dd4a8">Actualizar Ingreso</ST>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Inp label="Monto neto ($)" value={ingM} onChange={sIM} placeholder="0" type="number" />
        <Sel label="Mes" value={ingMes} onChange={sIMes} options={MONTHS_FULL.map((m, i) => ({ v: String(i + 1), l: m }))} />
      </div>
      <Btn color="#22c55e" onClick={async () => { if (!ingM || Number(ingM) <= 0) { showToast('Monto inválido', true); return; } await setIncome(Number(ingMes), Number(ingM)); showToast('✓ Ingreso actualizado'); sIM(''); }} disabled={busy}>Actualizar Ingreso</Btn>

      <Divider />
      <ST color="#60a8f0">Nuevo Rubro</ST>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><Inp label="Nombre" value={nRub} onChange={sNR} placeholder="Ej: Farmacia" /></div>
        <button onClick={async () => { if (!nRub.trim()) return; await addCategory(nRub.trim(), 'expense'); showToast(`✓ "${nRub}" agregado`); sNR(''); }} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: '#60a8f0', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Agregar</button>
      </div>


      <Divider />
      <ST color="#e070b0">Presupuestos</ST>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <Sel label="Rubro" value={budRub} onChange={setBudRub} options={[{ v: '', l: 'Seleccionar...' }, ...expenseCats.map(c => ({ v: c.name, l: `${RUBRO_EMOJI[c.name] || '📎'} ${c.name}` }))]} />
        <Inp label="Límite ($)" value={budMonto} onChange={setBudMonto} placeholder="0" type="number" />
      </div>
      <Btn color="#e070b0" onClick={() => { if (!budRub || !budMonto) { showToast('Completá', true); return; } setBudget(budRub, Math.round(Number(budMonto))); showToast('✓ Presupuesto guardado'); setBudRub(''); setBudMonto(''); }}>Guardar Presupuesto</Btn>
      {Object.entries(budgets).filter(([, v]) => v > 0).map(([rubro, monto]) => (
        <div key={rubro} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 12, color: '#e8e8f0' }}>{RUBRO_EMOJI[rubro] || '📎'} {rubro} — {Mn.fmt(monto)}/mes</span>
          <button onClick={() => setBudget(rubro, 0)} style={{ background: 'none', border: 'none', color: '#f06070', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
      ))}

      <Divider />
      <ST color="#f0a848">Crear Año</ST>
      <Btn color="#f0a848" onClick={async () => { const ny = Math.max(...years) + 1; await createYear(ny); showToast(`✓ Año ${ny} creado`); }}>Crear {Math.max(...years) + 1}</Btn>
      <div style={{ height: 80 }} />
    </div>
  );
}
