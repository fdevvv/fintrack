import { useState, useEffect } from 'react';
import { dolarService } from '@/services/dolar.service';
import { INVESTMENT_OPTIONS } from '@/utils/constants';
import { cardStyle } from '@/utils/styles';
import { ST, Btn } from '@/components/ui/Shared';

const ORDER = ['Oficial','Blue','Tarjeta','Bolsa','Contado con liquidación','Cripto','Mayorista'];
const NAMES = { Oficial:'Oficial',Blue:'Blue',Tarjeta:'Tarjeta',Bolsa:'MEP','Contado con liquidación':'CCL',Cripto:'Cripto',Mayorista:'Mayorista' };

export function DolarPage() {
  const [cotiz, setCotiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCotiz(await dolarService.fetchAll());
    } catch (e) {
      setError('No se pudo obtener la cotización. Revisá tu conexión.');
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const mapped = cotiz ? ORDER.map(k => ({ key:k,label:NAMES[k],...(cotiz.find(x=>x.nombre===k)||{}) })) : [];

  return (
    <div style={{ padding:'0 16px',maxWidth:700,margin:'0 auto' }}>
      <ST color="#f0a848">Cotizaciones del Dólar</ST>
      {error && (
        <div style={{ background:'rgba(240,96,112,0.1)',border:'1px solid rgba(240,96,112,0.2)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#f06070',marginBottom:16 }}>
          {error}
        </div>
      )}
      {loading && !cotiz ? (
        <div style={{ textAlign:'center',padding:30,color:'#5c5c72',fontSize:12 }}>Cargando...</div>
      ) : (
        <>
          <style>{`
            .dolar-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
            @media (min-width:768px) { .dolar-grid { grid-template-columns:repeat(3,1fr); } }
          `}</style>
          <div className="dolar-grid">
            {mapped.map((c,i) => (
              <div key={i} style={{ ...cardStyle,padding:12,gridColumn:i===0?'1 / -1':'auto' }}>
                <div style={{ fontSize:11,fontWeight:700,color:'#8888a0',marginBottom:8 }}>{c.label}</div>
                <div style={{ display:'flex',gap:16 }}>
                  <div>
                    <div style={{ fontSize:16,fontWeight:800,color:'#2dd4a8' }}>${c.compra!=null?c.compra.toLocaleString('es-AR'):'—'}</div>
                    <div style={{ fontSize:9,color:'#5c5c72' }}>Compra</div>
                  </div>
                  <div>
                    <div style={{ fontSize:16,fontWeight:800,color:'#f06070' }}>${c.venta!=null?c.venta.toLocaleString('es-AR'):'—'}</div>
                    <div style={{ fontSize:9,color:'#5c5c72' }}>Venta</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <Btn color="rgba(255,255,255,0.08)" onClick={load} disabled={loading} style={{ color:'#8888a0' }}>{loading ? 'Actualizando...' : '🔄 Actualizar Cotizaciones'}</Btn>

      <ST color="#7c6cf0">Inversiones Recomendadas</ST>
      <style>{`
        .inv-grid { display:flex; flex-direction:column; gap:8px; }
        @media (min-width:768px) { .inv-grid { display:grid; grid-template-columns:1fr 1fr; } }
      `}</style>
      <div className="inv-grid" style={{ paddingBottom:80 }}>
        {INVESTMENT_OPTIONS.map((inv,i) => (
          <div key={i} style={{ ...cardStyle,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:'#e8e8f0' }}>{inv.n}</div>
              <div style={{ fontSize:10,color:'#6c6c84',marginTop:2 }}>Rend: {inv.r} · {inv.d}</div>
            </div>
            <span style={{ padding:'3px 8px',borderRadius:6,fontSize:9,fontWeight:700,background:`${inv.tc}18`,color:inv.tc,whiteSpace:'nowrap' }}>{inv.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
