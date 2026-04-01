import { useState } from 'react';
import { profileService } from '@/services/profile.service';

const STEPS = [
  {
    icon: '👋',
    title: '¡Bienvenido a FinTrack!',
    description: 'Tu app de control de gastos personales. En los próximos pasos te mostramos todo lo que podés hacer.',
    detail: null,
  },
  {
    icon: '📊',
    title: 'Panel principal',
    description: 'Tu resumen mensual de un vistazo.',
    detail: [
      'Ves tus gastos e ingresos del mes actual',
      'Alertas cuando superás el presupuesto de una categoría',
      'Gráfico de gastos por categoría',
      'Comparación con el mes anterior',
    ],
  },
  {
    icon: '➕',
    title: 'Agregar movimiento',
    description: 'Registrá cualquier gasto o ingreso.',
    detail: [
      'Elegí el tipo: gasto, ingreso o inversión',
      'Asignale una categoría y el medio de pago',
      'Cuotas: dividí automáticamente en N meses',
      'Moneda: podés cargar en ARS o USD',
    ],
  },
  {
    icon: '📋',
    title: 'Movimientos',
    description: 'Toda tu actividad en un solo lugar.',
    detail: [
      'Filtrá por fecha, categoría, tipo o medio de pago',
      'Buscá por nombre de ítem',
      'Eliminá movimientos con un toque',
      'Historial de precios por producto',
    ],
  },
  {
    icon: '📅',
    title: 'Vista mensual',
    description: 'Controlá tu presupuesto mes a mes.',
    detail: [
      'Progreso de gasto por categoría vs presupuesto',
      'Ingresá tu ingreso mensual para ver el balance',
      'Drill-down: tocá un mes para ver el detalle completo',
      'Navegá entre meses desde el historial',
    ],
  },
  {
    icon: '💵',
    title: 'Dólar',
    description: 'Seguimiento del tipo de cambio USD.',
    detail: [
      'Cotización MEP actualizada automáticamente',
      'Convertí montos entre ARS y USD',
      'Útil si cargás gastos en dólares',
    ],
  },
  {
    icon: '📥',
    title: 'Importar',
    description: 'Cargá movimientos en masa fácilmente.',
    detail: [
      'Subí un archivo CSV con tus transacciones',
      'Compatible con resúmenes de tarjeta en PDF',
      'Hasta 500 movimientos por importación',
      'Preview antes de confirmar la carga',
    ],
  },
  {
    icon: '⚙️',
    title: 'Configuración',
    description: 'Personalizá la app a tu gusto.',
    detail: [
      'Creá y editá tus categorías de gastos',
      'Configurá tus medios de pago (tarjetas, efectivo, etc.)',
      'Ajustá el nombre de las secciones',
      'Gestioná tu perfil y preferencias',
    ],
  },
  {
    icon: '🚀',
    title: '¡Todo listo!',
    description: 'Ya sabés todo lo que necesitás para empezar.',
    detail: null,
    isLast: true,
  },
];

const DOT_ACTIVE  = { width:8, height:8, borderRadius:99, background:'#7c6cf0', transition:'all 0.2s' };
const DOT_INACTIVE = { width:6, height:6, borderRadius:99, background:'rgba(255,255,255,0.15)', transition:'all 0.2s' };

export function OnboardingGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    onClose();
    profileService.markOnboardingComplete().catch(() => {});
  };

  const next = () => isLast ? finish() : setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:10000,
      background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }}>
      <div style={{
        width:'100%', maxWidth:440,
        background:'#13131f',
        border:'1px solid rgba(124,108,240,0.25)',
        borderRadius:20,
        padding:'28px 28px 24px',
        boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
        display:'flex', flexDirection:'column', gap:20,
        position:'relative',
      }}>

        {/* Skip */}
        {!isLast && (
          <button onClick={finish} style={{
            position:'absolute', top:16, right:16,
            background:'none', border:'none',
            color:'#5c5c72', fontSize:12, fontWeight:600,
            cursor:'pointer', padding:'4px 8px',
          }}>
            Omitir
          </button>
        )}

        {/* Icon + título */}
        <div style={{ textAlign:'center' }}>
          <div style={{
            fontSize:44, marginBottom:12,
            lineHeight:1,
          }}>
            {current.icon}
          </div>
          <h2 style={{
            margin:0, fontSize:18, fontWeight:800,
            color:'#e8e8f0', marginBottom:8,
          }}>
            {current.title}
          </h2>
          <p style={{
            margin:0, fontSize:13, color:'#8c8ca8', lineHeight:1.5,
          }}>
            {current.description}
          </p>
        </div>

        {/* Detalle */}
        {current.detail && (
          <ul style={{
            margin:0, padding:0, listStyle:'none',
            display:'flex', flexDirection:'column', gap:8,
          }}>
            {current.detail.map((item, i) => (
              <li key={i} style={{
                display:'flex', alignItems:'flex-start', gap:10,
                background:'rgba(124,108,240,0.07)',
                border:'1px solid rgba(124,108,240,0.12)',
                borderRadius:10, padding:'9px 12px',
              }}>
                <span style={{ color:'#7c6cf0', fontSize:14, marginTop:1 }}>✓</span>
                <span style={{ fontSize:13, color:'#c8c8e0', lineHeight:1.4 }}>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, alignItems:'center' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={i === step ? DOT_ACTIVE : DOT_INACTIVE} />
          ))}
        </div>

        {/* Botones */}
        <div style={{ display:'flex', gap:10 }}>
          {step > 0 && (
            <button onClick={prev} style={{
              flex:1, padding:'11px 0', borderRadius:12,
              border:'1px solid rgba(255,255,255,0.08)',
              background:'transparent', color:'#8c8ca8',
              fontSize:13, fontWeight:600, cursor:'pointer',
            }}>
              Anterior
            </button>
          )}
          <button onClick={next} style={{
            flex:2, padding:'11px 0', borderRadius:12,
            border:'none',
            background: isLast
              ? 'linear-gradient(135deg,#7c6cf0,#2dd4a8)'
              : '#7c6cf0',
            color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
          }}>
            {isLast ? '¡Empezar!' : 'Siguiente →'}
          </button>
        </div>

        {/* Contador */}
        <p style={{ margin:0, textAlign:'center', fontSize:11, color:'#3c3c54' }}>
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
