import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { MONTHS_FULL, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { dolarService } from '@/services/dolar';
import { transactionsService } from '@/services/transactions';
import { ST, Inp, Sel, Btn, Divider } from '@/components/ui/Shared';
import { TicketScanner } from '@/components/tickets/TicketScanner';

export function AddPage() {
  const { year, years, categories, budgets, showToast, addWithInstallments, setIncome, addCategory, createYear, setBudget, loadAll } = useStore();
  const [item, sI] = useState('');
  const [sec, sS] = useState('');
  const [rub, sR] = useState('');
  const [monto, sM] = useState('');
  const [cuotas, sC] = useState('1');
  const [mes, sMes] = useState(String(new Date().getMonth() + 1));
  const [moneda, setMoneda] = useState('ARS');
  const [payMethod, setPayMethod] = useState('cash');
  const [destino, setDestino] = useState('manual');
  const [busy, sB] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [ingM, sIM] = useState('');
  const [ingMes, sIMes] = useState(String(new Date().getMonth() + 1));
  const [nRub, sNR] = useState('');
  const [budRub, setBudRub] = useState('');
  const [budMonto, setBudMonto] = useState('');

  const expenseCats = categories.filter(c => c.type === 'expense');

  const addG = async () => {
    if (!item || !rub || !monto || Number(monto) <= 0) { showToast('Completá todos los campos', true); return; }
    if (destino === 'tarjeta' && !sec) { showToast('Seleccioná la tarjeta', true); return; }
    sB(true);
    try {
      let finalMonto = Math.round(Number(monto));
      let usdAmount = null, usdRate = null;
      if (moneda === 'USD') {
        const rate = await dolarService.getOficialRate();
        if (!rate) { showToast('Error cotización', true); sB(false); return; }
        usdAmount = Number(monto); usdRate = rate; finalMonto = Math.round(usdAmount * rate);
      }
      const catObj = expenseCats.find(c => c.name === rub);
      const isManual = destino === 'manual';
      await addWithInstallments({
        item_name: item.toUpperCase(), description: item.toUpperCase(),
        category_id: catObj?.id || null,
        section: isManual ? 'OTROS' : sec,
        amount_per_installment: finalMonto,
        installment_total: isManual ? 1 : (Number(cuotas) || 1),
        start_month: Number(mes), year, currency: 'ARS',
        payment_method: isManual ? payMethod : 'credit_card',
        usd_amount: usdAmount, usd_rate: usdRate,
        source: isManual ? 'manual' : 'imported',
        ticket_items: ticketData?.items || null,
        ticket_image_url: ticketData?.imageUrl || null,
        ticket_total: ticketData?.total || null,
      });
      showToast(moneda === 'USD' ? `✓ USD ${usdAmount} × $${usdRate} = ${Mn.fmt(finalMonto)}` : '✓ Gasto agregado');
      sI(''); sM(''); setTicketData(null);
    } catch (err) { showToast(err.message || 'Error', true); }
    sB(false);
  };

  const handleTicketConfirm = (data) => {
    setTicketData(data);
    sM(String(data.total));
    setShowTicket(false);
    showToast(`✓ Ticket: ${data.items.length} items, total ${Mn.fmt(data.total)}`);
  };

  const syncUSD = async () => {
    sB(true);
    try {
      const rate = await dolarService.getOficialRate();
      if (!rate) { showToast('Error cotización', true); sB(false); return; }
      const count = await transactionsService.syncUsdRates(year, rate);
      showToast(`✓ ${count} gastos USD actualizados · $${rate}/USD`);
      await loadAll();
    } catch { showToast('Error sync USD', true); }
    sB(false);
  };

  return (
    <div style={{ padding: '0 16px', maxWidth: 600, margin: '0 auto' }}>
      <ST color="#7c6cf0">Agregar Gasto</ST>

      {/* Ticket Scanner toggle */}
      {showTicket ? (
        <TicketScanner onConfirm={handleTicketConfirm} onCancel={() => setShowTicket(false)} />
      ) : (
        <>
          <Btn color="rgba(255,255,255,0.06)" onClick={() => setShowTicket(true)} style={{ color: '#60a8f0', border: '1px solid rgba(96,168,240,0.15)', marginBottom: 16 }}>
            📸 Cargar ticket (OCR)
          </Btn>

          {ticketData && (
            <div style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, marginBottom: 12, background: 'rgba(96,168,240,0.1)', color: '#60a8f0', border: '1px solid rgba(96,168,240,0.15)' }}>
              ✓ Ticket: {ticketData.items.length} items · Total {Mn.fmt(ticketData.total)}
              <button onClick={() => { setTicketData(null); sM(''); }} style={{ background: 'none', border: 'none', color: '#f06070', fontSize: 12, cursor: 'pointer', marginLeft: 8 }}>✕</button>
            </div>
          )}

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
                  flex:1,padding:'10px 12px',borderRadius:10,border:`1px solid ${destino===opt.v?opt.c+'40':'rgba(255,255,255,0.06)'}`,
                  background:destino===opt.v?opt.c+'15':'rgba(255,255,255,0.02)',cursor:'pointer',textAlign:'left',transition:'all .15s',
                }}>
                  <div style={{ fontSize:13,fontWeight:600,color:destino===opt.v?opt.c:'#8888a0' }}>{opt.l}</div>
                  <div style={{ fontSize:10,color:'#5c5c72',marginTop:2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {destino === 'tarjeta' ? (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <Sel label="Sección" value={sec} onChange={sS} options={[{ v:'',l:'Seleccionar...' },{ v:'VISA',l:'Visa Galicia' },{ v:'MASTERCARD',l:'Mastercard Galicia' },{ v:'OTROS',l:'Otros' },{ v:'PRESTAMOS',l:'Préstamos / Hogar' }]} />
              <Sel label="Rubro" value={rub} onChange={sR} options={[{ v:'',l:'Seleccionar...' },...expenseCats.map(c => ({ v:c.name,l:`${RUBRO_EMOJI[c.name]||'📎'} ${c.name}` }))]} />
            </div>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <Sel label="Método pago" value={payMethod} onChange={setPayMethod} options={[{ v:'cash',l:'Efectivo' },{ v:'qr_debit',l:'QR Débito' },{ v:'debit_card',l:'Tarjeta débito' },{ v:'transfer',l:'Transferencia' }]} />
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
        </>
      )}

      <Divider />
      <ST color="#2dd4a8">Actualizar Ingreso</ST>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Inp label="Monto neto ($)" value={ingM} onChange={sIM} placeholder="0" type="number" />
        <Sel label="Mes" value={ingMes} onChange={sIMes} options={MONTHS_FULL.map((m, i) => ({ v: String(i + 1), l: m }))} />
      </div>
      <Btn color="#2dd4a8" onClick={async () => { if (!ingM || Number(ingM) <= 0) { showToast('Monto inválido', true); return; } sB(true); await setIncome(Number(ingMes), Number(ingM)); showToast('✓ Ingreso actualizado'); sIM(''); sB(false); }} disabled={busy}>Actualizar Ingreso</Btn>

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
