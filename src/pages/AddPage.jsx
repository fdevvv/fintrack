import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { MONTHS_FULL, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn, parseARS } from '@/utils/money';
import { useAddTransaction } from '@/hooks/transactions/useAddTransaction';
import { useSyncUsd } from '@/hooks/transactions/useSyncUsd';
import { useSavingsGoals } from '@/hooks/savings/useSavingsGoals';
import { ST, Inp, Sel, Btn, Divider, EmojiPicker } from '@/components/ui/Shared';

export function AddPage() {
  const { year, years, categories, budgets, transactions, userSections, setIncome, addCategory, createYear, setBudget, addSection } = useStore();
  const { showToast } = useUiStore();
  const { add, loading: addLoading } = useAddTransaction();
  const { sync, loading: syncLoading } = useSyncUsd();
  const { goals, addGoal, removeGoal, updateSaved } = useSavingsGoals();
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
  const [nRubIcon, sNRI] = useState('📎');
  const [budRub, setBudRub] = useState('');
  const [budMonto, setBudMonto] = useState('');
  const [editingBudget, setEditingBudget] = useState(null); // rubro being edited
  const [editBudRub, setEditBudRub] = useState('');
  const [editBudMonto, setEditBudMonto] = useState('');
  const [newSecName, setNewSecName] = useState('');
  const [showNewSec, setShowNewSec] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [repeatMes, setRepeatMes] = useState(() => {
    const m = new Date().getMonth();
    return String(m === 0 ? 11 : m - 1);
  });
  const [repeating, setRepeating] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [addAmt, setAddAmt] = useState('');

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
    if (!item || !rub || !monto || !(parseARS(monto) > 0)) { showToast('Completá todos los campos', true); return; }
    if (destino === 'tarjeta' && !sec) { showToast('Seleccioná la tarjeta', true); return; }
    try {
      const catObj = expenseCats.find(c => c.name === rub);
      const result = await add({
        item_name: item,
        category_id: catObj?.id || null,
        section: sec,
        amount: parseARS(monto),
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
      <p style={{ fontSize:11,color:'#6c7280',marginBottom:14,lineHeight:1.5 }}>Registrá un gasto a mano. Lo que agregues como <span style={{color:'#2dd4a8',fontWeight:600}}>Gasto del día</span> se ve en la solapa del mes, y lo que sea <span style={{color:'#7c6cf0',fontWeight:600}}>Tarjeta / Cuotas</span> aparece en Detalle.</p>

      <Inp label="Nombre del gasto" value={item} onChange={sI} placeholder="Ej: NETFLIX, ZAPATILLAS" />

      {/* Destino: Mes (manual) vs Detalle (tarjeta/préstamo) */}
      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c7280',marginBottom:5 }}>¿Dónde va este gasto?</label>
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
              <div style={{ fontSize:10,color:'#6c7280',marginTop:2 }}>{opt.desc}</div>
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
                    style={{ flex:1,padding:'9px 12px',borderRadius:8,border:'1px solid rgba(124,108,240,0.3)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,outline:'none' }}
                  />
                  <button type="button" onClick={handleCreateSection} style={{ height:40,padding:'0 12px',borderRadius:8,border:'none',background:'#7c6cf0',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer' }}>Crear</button>
                </div>
              )}
            </div>
            <Sel label="Rubro" value={rub} onChange={sR} options={[{ v:'',l:'Seleccionar...' },...expenseCats.map(c => ({ v:c.name,l:`${c.icon||RUBRO_EMOJI[c.name]||'📎'} ${c.name}` }))]} />
          </div>
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <Sel label="Método pago" value={payMethod} onChange={setPayMethod} options={[{ v:'cash',l:'Efectivo' },{ v:'qr_debit',l:'QR' },{ v:'debit_card',l:'Tarjeta débito' },{ v:'transfer',l:'Transferencia' }]} />
          <Sel label="Rubro" value={rub} onChange={sR} options={[{ v:'',l:'Seleccionar...' },...expenseCats.map(c => ({ v:c.name,l:`${c.icon||RUBRO_EMOJI[c.name]||'📎'} ${c.name}` }))]} />
        </div>
      )}
      {destino === 'tarjeta' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Inp label="Monto" value={monto} onChange={sM} placeholder="Ej: 150.000" type="text" inputMode="decimal" />
          <Sel label="Moneda" value={moneda} onChange={setMoneda} options={[{ v: 'ARS', l: 'ARS $' }, { v: 'USD', l: 'USD' }]} />
          <Inp label="Cuotas" value={cuotas} onChange={sC} placeholder="1" type="number" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Inp label="Monto" value={monto} onChange={sM} placeholder="Ej: 150.000" type="text" inputMode="decimal" />
          <Sel label="Moneda" value={moneda} onChange={setMoneda} options={[{ v: 'ARS', l: 'ARS $' }, { v: 'USD', l: 'USD' }]} />
        </div>
      )}
      {monto && !isNaN(parseARS(monto)) && (
        <div style={{ fontSize:11, color:'#2dd4a8', marginTop:-8, marginBottom:8, paddingLeft:2 }}>
          = {Mn.fmt(parseARS(monto))}
        </div>
      )}
      <Sel label="Mes" value={mes} onChange={sMes} options={MONTHS_FULL.map((m, i) => ({ v: String(i + 1), l: m }))} />
      <Btn color={destino==='manual'?'#2dd4a8':'#7c6cf0'} onClick={addG} disabled={busy}>{busy ? 'Guardando...' : moneda === 'USD' ? 'Agregar (convertir a ARS)' : destino==='manual'?'Agregar a Gastos del Mes':'Agregar a Detalle'}</Btn>
      <Btn color="rgba(255,255,255,0.08)" onClick={syncUSD} disabled={busy} style={{ color: '#f0a848' }}>🔄 Sincronizar gastos USD</Btn>
      <p style={{ fontSize:11,color:'#6c7280',marginTop:-8,marginBottom:14,lineHeight:1.5 }}>Actualiza el valor en pesos de todos tus gastos cargados en dólares usando el dólar oficial actual.</p>

      <Divider />
      <ST color="#2dd4a8">Actualizar Ingreso</ST>
      <p style={{ fontSize:11,color:'#6c7280',marginBottom:14,lineHeight:1.5 }}>Ingresá tu sueldo o ingreso neto de cada mes. Se usa para calcular el balance mensual y cuánto ahorrás.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Inp label="Monto neto ($)" value={ingM} onChange={sIM} placeholder="Ej: 350.000" type="text" inputMode="decimal" />
        <Sel label="Mes" value={ingMes} onChange={sIMes} options={MONTHS_FULL.map((m, i) => ({ v: String(i + 1), l: m }))} />
      </div>
      {ingM && !isNaN(parseARS(ingM)) && (
        <div style={{ fontSize:11, color:'#22c55e', marginTop:-8, marginBottom:8, paddingLeft:2 }}>
          = {Mn.fmt(parseARS(ingM))}
        </div>
      )}
      <Btn color="#22c55e" onClick={async () => { if (!(parseARS(ingM) > 0)) { showToast('Monto inválido', true); return; } await setIncome(Number(ingMes), Math.round(parseARS(ingM))); showToast('✓ Ingreso actualizado'); sIM(''); }} disabled={busy}>Actualizar Ingreso</Btn>
      <Sel label="Repetir gastos de" value={repeatMes} onChange={setRepeatMes} options={MONTHS_FULL.map((m, i) => ({ v: String(i), l: m }))} />
      <Btn color="rgba(255,255,255,0.06)" disabled={busy||repeating} style={{ color:'#a8a0f8' }} onClick={async () => {
        const mo = Number(repeatMes);
        const manualLast = transactions.filter(t =>
          t.type === 'expense' && !t.section && new Date(t.transaction_date).getMonth() === mo
        );
        if (!manualLast.length) { showToast(`Sin gastos manuales en ${MONTHS_FULL[mo]}`, true); return; }
        setRepeating(true);
        let c = 0;
        const nowMonth = new Date().getMonth() + 1;
        for (const t of manualLast) {
          try {
            await add({
              item_name: t.item_name || t.description || 'Gasto',
              category_id: t.category_id || null,
              section: '',
              amount: t.amount_cents,
              cuotas: 1,
              start_month: nowMonth,
              currency: t.currency || 'ARS',
              payment_method: t.payment_method || 'cash',
              destino: 'manual',
            });
            c++;
          } catch {}
        }
        showToast(`✓ ${c} gastos de ${MONTHS_FULL[mo]} copiados`);
        setRepeating(false);
      }}>
        {repeating ? 'Copiando...' : '🔁 Repetir gastos'}
      </Btn>

      <Divider />
      <ST color="#60a8f0">Nuevo Rubro</ST>
      <p style={{ fontSize:11,color:'#6c7280',marginBottom:14,lineHeight:1.5 }}>Creá una categoría de gasto personalizada, como Farmacia, Mascota o Gimnasio.</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6c7280', marginBottom: 5 }}>Icono</label>
          <EmojiPicker value={nRubIcon} onChange={sNRI} />
        </div>
        <Inp label="Nombre" value={nRub} onChange={sNR} placeholder="Ej: Farmacia" style={{ flex: 1, marginBottom: 0 }} />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, marginBottom: 5, visibility: 'hidden' }}>_</label>
          <button onClick={async () => { if (!nRub.trim()) return; await addCategory(nRub.trim(), 'expense', nRubIcon); showToast(`✓ "${nRub}" agregado`); sNR(''); sNRI('📎'); }} style={{ height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: '#60a8f0', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
        </div>
      </div>


      <Divider />
      <ST color="#e070b0">Presupuestos</ST>
      <p style={{ fontSize:11,color:'#6c7280',marginBottom:14,lineHeight:1.5 }}>Fijá un límite de gasto mensual por rubro. Te avisamos en el panel cuando estás cerca de superarlo.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <Sel label="Rubro" value={budRub} onChange={setBudRub} options={[{ v: '', l: 'Seleccionar...' }, ...expenseCats.map(c => ({ v: c.name, l: `${c.icon || RUBRO_EMOJI[c.name] || '📎'} ${c.name}` }))]} />
        <Inp label="Límite ($)" value={budMonto} onChange={setBudMonto} placeholder="Ej: 50.000" type="text" inputMode="decimal" />
      </div>
      <Btn color="#e070b0" onClick={() => { if (!budRub || !(parseARS(budMonto) > 0)) { showToast('Completá', true); return; } setBudget(budRub, Math.round(parseARS(budMonto))); showToast('✓ Presupuesto guardado'); setBudRub(''); setBudMonto(''); }}>Guardar Presupuesto</Btn>
      {Object.entries(budgets).filter(([, v]) => v > 0).map(([rubro, monto]) => (
        <div key={rubro} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {editingBudget === rubro ? (
            <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display:'block',fontSize:10,fontWeight:600,color:'#6c7280',marginBottom:4 }}>Rubro</label>
                  <select value={editBudRub} onChange={e => setEditBudRub(e.target.value)}
                    style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid rgba(224,112,176,0.3)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:14,outline:'none',boxSizing:'border-box',appearance:'none',WebkitAppearance:'none' }}>
                    {expenseCats.map(c => <option key={c.name} value={c.name}>{c.icon || RUBRO_EMOJI[c.name] || '📎'} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block',fontSize:10,fontWeight:600,color:'#6c7280',marginBottom:4 }}>Límite ($)</label>
                  <input
                    type="text" inputMode="decimal" value={editBudMonto} onChange={e => setEditBudMonto(e.target.value)}
                    placeholder="Ej: 50.000"
                    style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid rgba(224,112,176,0.3)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:14,outline:'none',boxSizing:'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={async () => {
                  const newAmt = Math.round(parseARS(editBudMonto));
                  if (!editBudRub || !(newAmt > 0)) { showToast('Completá los campos', true); return; }
                  if (editBudRub !== rubro) await setBudget(rubro, 0);
                  await setBudget(editBudRub, newAmt);
                  showToast('✓ Presupuesto actualizado');
                  setEditingBudget(null);
                }} style={{ flex:1,padding:'8px',borderRadius:8,border:'none',background:'#e070b0',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer' }}>Guardar</button>
                <button onClick={() => setEditingBudget(null)} style={{ padding:'8px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'none',color:'#8888a0',fontSize:12,cursor:'pointer' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 12, color: '#e8e8f0' }}>{expenseCats.find(c => c.name === rubro)?.icon || RUBRO_EMOJI[rubro] || '📎'} {rubro} — {Mn.fmt(monto)}/mes</span>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => { setEditingBudget(rubro); setEditBudRub(rubro); setEditBudMonto(monto.toLocaleString('es-AR')); }} style={{ background:'none',border:'none',color:'#a0a0b8',fontSize:13,cursor:'pointer',padding:'4px' }}>✏️</button>
                <button onClick={() => setBudget(rubro, 0)} style={{ background: 'none', border: 'none', color: '#f06070', fontSize: 14, cursor: 'pointer', padding:'4px' }}>✕</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <Divider />
      <ST color="#f0a848">Crear Año</ST>
      <p style={{ fontSize:11,color:'#6c7280',marginBottom:14,lineHeight:1.5 }}>Habilitá un nuevo año para poder registrar y consultar los gastos de ese período.</p>
      <Btn color="#f0a848" onClick={async () => { const ny = Math.max(...years) + 1; await createYear(ny); showToast(`✓ Año ${ny} creado`); }}>Crear {Math.max(...years) + 1}</Btn>

      <Divider />
      <ST color="#4ade80">Metas de Ahorro</ST>
      <p style={{ fontSize:11,color:'#6c7280',marginBottom:14,lineHeight:1.5 }}>Definí un objetivo de ahorro con un monto y fecha límite. Se muestra en el panel con barra de progreso.</p>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <Inp label="Nombre" value={goalName} onChange={setGoalName} placeholder="Ej: Vacaciones" />
        <Inp label="Objetivo ($)" value={goalTarget} onChange={setGoalTarget} placeholder="Ej: 500.000" type="text" inputMode="decimal" />
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <Inp label="Ahorrado hasta ahora ($)" value={goalSaved} onChange={setGoalSaved} placeholder="Ej: 100.000" type="text" inputMode="decimal" />
        <Inp label="Fecha límite (Ej: Dic 2026)" value={goalDeadline} onChange={setGoalDeadline} placeholder="Dic 2026" />
      </div>
      <Btn color="#4ade80" style={{ color:'#0a0a12' }} onClick={() => {
        if (!goalName.trim() || !(parseARS(goalTarget) > 0)) { showToast('Completá nombre y objetivo', true); return; }
        addGoal({ name: goalName.trim(), target: Math.round(parseARS(goalTarget)), saved: Math.round(parseARS(goalSaved) || 0), deadline: goalDeadline.trim() });
        showToast('✓ Meta guardada');
        setGoalName(''); setGoalTarget(''); setGoalSaved(''); setGoalDeadline('');
      }}>Guardar Meta</Btn>

      {goals.length > 0 && goals.map(g => {
        const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100)) : 0;
        const open = addingTo === g.id;
        return (
          <div key={g.id} style={{ padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <span style={{ fontSize:15,color:'#e8e8f0',fontWeight:700 }}>🎯 {g.name}</span>
                {g.deadline && <span style={{ fontSize:11,color:'#6c7280',marginLeft:8 }}>{g.deadline}</span>}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ fontSize:13,color:'#6c7280',fontVariantNumeric:'tabular-nums' }}>{Mn.fmt(g.saved_amount)} / {Mn.fmt(g.target_amount)}</span>
                <button onClick={() => { setAddingTo(open ? null : g.id); setAddAmt(''); }} style={{ background:open?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.05)',border:'none',borderRadius:6,color:'#4ade80',fontSize:13,fontWeight:700,cursor:'pointer',padding:'2px 7px',lineHeight:1 }}>+</button>
                <button onClick={() => removeGoal(g.id)} style={{ background:'none',border:'none',color:'#f06070',fontSize:14,cursor:'pointer',padding:'2px 4px',opacity:0.6 }}>✕</button>
              </div>
            </div>
            <div style={{ marginTop:6,height:4,borderRadius:4,background:'rgba(255,255,255,0.07)',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${pct}%`,background:'#4ade80',borderRadius:4,transition:'width .3s' }} />
            </div>
            {open && (
              <div style={{ display:'flex',gap:6,marginTop:8,alignItems:'center' }}>
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 50.000"
                  value={addAmt}
                  onChange={e => setAddAmt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && parseARS(addAmt) > 0) {
                      updateSaved(g.id, g.saved_amount + Math.round(parseARS(addAmt)));
                      showToast(`✓ +${Mn.fmt(Math.round(parseARS(addAmt)))} a "${g.name}"`);
                      setAddingTo(null); setAddAmt('');
                    }
                  }}
                  style={{ flex:1,padding:'9px 12px',borderRadius:8,border:'1px solid rgba(74,222,128,0.3)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,outline:'none' }}
                />
                <button type="button" onClick={() => {
                  if (!(parseARS(addAmt) > 0)) return;
                  updateSaved(g.id, g.saved_amount + Math.round(parseARS(addAmt)));
                  showToast(`✓ +${Mn.fmt(Math.round(parseARS(addAmt)))} a "${g.name}"`);
                  setAddingTo(null); setAddAmt('');
                }} style={{ height:40,padding:'0 14px',borderRadius:8,border:'none',background:'#4ade80',color:'#0a0a12',fontSize:12,fontWeight:700,cursor:'pointer' }}>Agregar</button>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ height: 80 }} />
    </div>
  );
}
