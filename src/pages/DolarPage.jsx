import { useState, useEffect } from 'react';
import { dolarService } from '@/services/dolar.service';
import { INVESTMENT_OPTIONS } from '@/utils/constants';
import { ST, Btn } from '@/components/ui/Shared';

const ORDER = ['Oficial','Blue','Tarjeta','Bolsa','Contado con liquidación','Cripto','Mayorista'];
const NAMES = {
  Oficial:'Oficial', Blue:'Blue', Tarjeta:'Tarjeta',
  Bolsa:'MEP', 'Contado con liquidación':'CCL', Cripto:'Cripto', Mayorista:'Mayorista',
};

/* ─── Cotización card ───────────────────────────────────────────────────── */
function CotizCard({ c, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(251,191,36,0.06)' : '#111219',
      borderRadius: 12,
      padding: '14px 16px',
      border: highlight ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color: highlight ? '#fbbf24' : '#64748b',
          textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
          {c.label}
        </div>
        <div style={{ display:'flex', gap:20, alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:10, color:'#475569', marginBottom:2 }}>Compra</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#34d399',
              fontVariantNumeric:'tabular-nums', letterSpacing:'-0.3px' }}>
              ${c.compra != null ? c.compra.toLocaleString('es-AR') : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#475569', marginBottom:2 }}>Venta</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#f87171',
              fontVariantNumeric:'tabular-nums', letterSpacing:'-0.3px' }}>
              ${c.venta != null ? c.venta.toLocaleString('es-AR') : '—'}
            </div>
          </div>
        </div>
      </div>
      {highlight && (
        <div style={{ width:32,height:32,borderRadius:8,
          background:'rgba(251,191,36,0.12)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:18, flexShrink:0 }}>
          💵
        </div>
      )}
    </div>
  );
}

/* ─── Investment card ───────────────────────────────────────────────────── */
function InvCard({ inv }) {
  return (
    <div style={{
      background: '#111219',
      borderRadius: 12,
      padding: '14px 16px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', gap:10, marginBottom:8 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'#e2e8f0',
          letterSpacing:'-0.1px', lineHeight:1.3 }}>
          {inv.n}
        </div>
        <span style={{
          padding:'3px 9px', borderRadius:20, fontSize:9, fontWeight:700,
          background:`${inv.tc}18`, color:inv.tc,
          border:`1px solid ${inv.tc}28`,
          whiteSpace:'nowrap', flexShrink:0,
        }}>
          {inv.tag}
        </span>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, color:inv.tc,
          background:`${inv.tc}12`, padding:'3px 8px', borderRadius:6 }}>
          {inv.r}
        </div>
        <div style={{ fontSize:11, color:'#64748b', lineHeight:1.4 }}>{inv.d}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   DOLAR PAGE
════════════════════════════════════════════════════════════════════════ */
export function DolarPage() {
  const [cotiz, setCotiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCotiz(await dolarService.fetchAll());
    } catch {
      setError('No se pudo obtener la cotización. Revisá tu conexión.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const mapped = cotiz
    ? ORDER.map(k => ({ key:k, label:NAMES[k], ...(cotiz.find(x => x.nombre === k) || {}) }))
    : [];

  return (
    <div style={{ padding:'0 16px', maxWidth:700, margin:'0 auto' }}>
      <style>{`
        .dolar-grid { display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:14px; }
        .inv-grid   { display:flex; flex-direction:column; gap:8px; }
        @media (min-width:500px) {
          .dolar-grid { grid-template-columns:1fr 1fr; }
        }
        @media (min-width:768px) {
          .dolar-grid { grid-template-columns:repeat(3,1fr); }
          .inv-grid   { display:grid; grid-template-columns:1fr 1fr; }
        }
      `}</style>

      <ST color="#fbbf24">Cotizaciones del Dólar</ST>

      {error && (
        <div style={{
          background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)',
          borderRadius:10, padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12,
          display:'flex', alignItems:'center', gap:8,
        }}>
          ⚠ {error}
        </div>
      )}

      {loading && !cotiz ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i} style={{ height:78, borderRadius:12,
              background:'rgba(255,255,255,0.04)',
              animation:'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div className="dolar-grid">
          {mapped.map((c,i) => (
            <CotizCard key={i} c={c} highlight={c.key === 'Blue'} />
          ))}
        </div>
      )}

      <Btn
        color="rgba(255,255,255,0.07)"
        onClick={load}
        disabled={loading}
        style={{ color:'#94a3b8', border:'1px solid rgba(255,255,255,0.08)' }}
      >
        {loading ? '⟳ Actualizando...' : '🔄 Actualizar cotizaciones'}
      </Btn>

      <ST color="#818cf8">Inversiones Recomendadas</ST>
      <div className="inv-grid" style={{ paddingBottom:80 }}>
        {INVESTMENT_OPTIONS.map((inv,i) => (
          <InvCard key={i} inv={inv} />
        ))}
      </div>
    </div>
  );
}
