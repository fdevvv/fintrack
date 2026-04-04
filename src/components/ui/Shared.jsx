import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { inputStyle, cardStyle, tagStyle } from '@/utils/styles';
import { SECTIONS, RUBRO_EMOJI, getSubIcon } from '@/utils/constants';

/* ─── Section Title ────────────────────────────────────────────────────── */
export function ST({ children, color = '#818cf8', subtitle }) {
  return (
    <div style={{ margin:'24px 0 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:3, height:18, borderRadius:99, background:color, flexShrink:0 }} />
        <h2 style={{ fontSize:15, fontWeight:700, color:'#e2e8f0', margin:0,
          letterSpacing:'-0.2px' }}>
          {children}
        </h2>
      </div>
      {subtitle && (
        <p style={{ fontSize:12, color:'#64748b', margin:'5px 0 0 11px', lineHeight:1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── Input ────────────────────────────────────────────────────────────── */
export function Inp({ label, value, onChange, placeholder, type = 'text', inputMode: im, style: extra }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:12, ...extra }}>
      {label && (
        <label style={{ display:'block', fontSize:11, fontWeight:600,
          color: focused ? '#818cf8' : '#64748b', marginBottom:5,
          letterSpacing:'0.3px', textTransform:'uppercase', transition:'color 0.15s' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={im ?? (type==='number' ? 'numeric' : undefined)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          border: `1px solid ${focused ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.09)'}`,
          background: focused ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.05)',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
        }}
      />
    </div>
  );
}

/* ─── Select ───────────────────────────────────────────────────────────── */
export function Sel({ label, value, onChange, options, style: extra }) {
  const [focused, setFocused] = useState(false);
  const chevron = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";
  return (
    <div style={{ marginBottom:12, ...extra }}>
      {label && (
        <label style={{ display:'block', fontSize:11, fontWeight:600,
          color: focused ? '#818cf8' : '#64748b', marginBottom:5,
          letterSpacing:'0.3px', textTransform:'uppercase', transition:'color 0.15s' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          appearance:'none', WebkitAppearance:'none',
          backgroundImage: chevron,
          backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center',
          paddingRight:36,
          border: `1px solid ${focused ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.09)'}`,
          background: `${focused ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.05)'} ${chevron} no-repeat right 12px center`,
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
        }}>
        {options.map((o,i) => <option key={i} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

/* ─── Button ───────────────────────────────────────────────────────────── */
export function Btn({ children, color, onClick, disabled, style: s }) {
  const isDisabled = disabled;
  const gradient = !isDisabled && !color
    ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
    : null;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width:'100%', padding:'11px 16px', borderRadius:10, border:'none',
        background: isDisabled
          ? 'rgba(255,255,255,0.06)'
          : (gradient || color),
        color: isDisabled ? '#475569' : '#fff',
        fontSize:14, fontWeight:600, cursor: isDisabled ? 'default' : 'pointer',
        marginBottom:10, opacity: isDisabled ? 0.6 : 1,
        transition:'all 0.15s', letterSpacing:'-0.1px',
        fontFamily:"'Inter', system-ui, sans-serif",
        boxShadow: (!isDisabled && (gradient || color))
          ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
        ...s,
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.opacity = '1'; }}
      onMouseDown={e => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
      {children}
    </button>
  );
}

/* ─── Panel (Card) ─────────────────────────────────────────────────────── */
export function Pnl({ title, children, accent }) {
  return (
    <div style={{
      ...cardStyle,
      marginBottom:12,
      borderTop: accent ? `2px solid ${accent}` : undefined,
    }}>
      {title && (
        <div style={{ fontSize:10, fontWeight:700, color:'#475569', margin:'0 0 14px',
          textTransform:'uppercase', letterSpacing:'1px' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Divider ──────────────────────────────────────────────────────────── */
export function Divider({ label }) {
  if (label) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
        <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize:10, fontWeight:600, color:'#475569',
          letterSpacing:'0.5px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          {label}
        </span>
        <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }} />
      </div>
    );
  }
  return <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.05)', margin:'20px 0' }} />;
}

/* ─── Toast ────────────────────────────────────────────────────────────── */
export function Toast({ toast, onClear }) {
  useEffect(() => {
    if (toast) { const t = setTimeout(onClear, 3000); return () => clearTimeout(t); }
  }, [toast]);
  if (!toast) return null;

  const isError = toast.e;
  return (
    <div style={{
      position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)',
      background: isError ? '#1c1014' : '#0e1c15',
      border: `1px solid ${isError ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
      color: isError ? '#f87171' : '#34d399',
      padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:600,
      zIndex:9999,
      boxShadow:`0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${isError ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)'}`,
      maxWidth:'90vw', textAlign:'center',
      animation:'slideUp 0.2s ease-out',
      display:'flex', alignItems:'center', gap:8,
    }}>
      <span style={{ fontSize:15 }}>{isError ? '⚠' : '✓'}</span>
      {toast.m}
    </div>
  );
}

/* ─── Confirm Modal ────────────────────────────────────────────────────── */
export function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(6px)',display:'flex',alignItems:'center',
      justifyContent:'center',zIndex:10000,padding:20 }} onClick={onCancel}>
      <div style={{ background:'#1c2030',borderRadius:16,padding:24,
        maxWidth:360,width:'100%',
        border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,color:'#e2e8f0',marginBottom:8,
          letterSpacing:'-0.3px' }}>{title}</div>
        <div style={{ fontSize:13,color:'#64748b',lineHeight:1.6,marginBottom:20 }}>{message}</div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1,padding:'10px 0',borderRadius:10,
            border:'1px solid rgba(255,255,255,0.08)',background:'transparent',
            color:'#94a3b8',fontSize:13,fontWeight:600,cursor:'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex:1,padding:'10px 0',borderRadius:10,border:'none',
            background:'linear-gradient(135deg,#ef4444,#f87171)',
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
          }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Installment Delete Modal ─────────────────────────────────────────── */
export function InstallmentDeleteModal({ show, item, onDeleteOne, onDeleteAll, onCancel }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(6px)',display:'flex',alignItems:'center',
      justifyContent:'center',zIndex:10000,padding:20 }} onClick={onCancel}>
      <div style={{ background:'#1c2030',borderRadius:16,padding:24,
        maxWidth:360,width:'100%',
        border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,color:'#e2e8f0',marginBottom:6,
          letterSpacing:'-0.3px' }}>Eliminar cuota</div>
        <div style={{ fontSize:13,color:'#64748b',lineHeight:1.6,marginBottom:20 }}>
          <span style={{ color:'#e2e8f0',fontWeight:600 }}>{item?.item_name}</span>
          {' '}tiene {item?.installment_total} cuotas. ¿Qué querés eliminar?
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          <button onClick={onDeleteOne} style={{
            padding:'12px 16px',borderRadius:10,
            border:'1px solid rgba(248,113,113,0.25)',
            background:'rgba(248,113,113,0.08)',
            color:'#f87171',fontSize:13,fontWeight:600,cursor:'pointer',textAlign:'left',
            transition:'background 0.15s',
          }}>
            Solo la cuota {item?.installment_current}/{item?.installment_total}
            <span style={{ display:'block',fontSize:11,color:'#64748b',fontWeight:400,marginTop:3 }}>
              Las otras cuotas se mantienen
            </span>
          </button>
          <button onClick={onDeleteAll} style={{
            padding:'12px 16px',borderRadius:10,border:'none',
            background:'linear-gradient(135deg,#ef4444,#f87171)',
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',textAlign:'left',
          }}>
            Eliminar todas las cuotas
            <span style={{ display:'block',fontSize:11,color:'rgba(255,255,255,0.65)',fontWeight:400,marginTop:3 }}>
              Se borran las {item?.installment_total} cuotas
            </span>
          </button>
          <button onClick={onCancel} style={{
            padding:'10px 0',borderRadius:10,
            border:'1px solid rgba(255,255,255,0.08)',background:'transparent',
            color:'#94a3b8',fontSize:13,fontWeight:600,cursor:'pointer',
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Item Icon ────────────────────────────────────────────────────────── */
export function ItemIcon({ item, overrideEmoji, onClick }) {
  const catName = item.categories?.name || item.category_name || '';
  if (!overrideEmoji && catName === 'Suscripciones') {
    const svg = getSubIcon(item.item_name);
    if (svg) return (
      <div
        style={{ width:38,height:38,borderRadius:10,overflow:'hidden',flexShrink:0, cursor: onClick ? 'pointer' : 'default' }}
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={onClick}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        width:38, height:38, borderRadius:10,
        background:'rgba(255,255,255,0.06)',
        border: onClick ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:19, flexShrink:0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {overrideEmoji || RUBRO_EMOJI[catName] || item.categories?.icon || '📎'}
    </div>
  );
}

/* ─── Month Bar ────────────────────────────────────────────────────────── */
export function MonthBar({ sel, onSel }) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', padding:'0 0 10px' }}>
      {[{ l:'Todos', v:-1 }, ...months.map((m,i) => ({ l:m, v:i }))].map(c => (
        <button key={c.v} onClick={() => onSel(c.v)} style={{
          padding:'5px 12px', borderRadius:20, border:'none',
          fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
          transition:'all 0.15s',
          background: sel===c.v ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
          color: sel===c.v ? '#818cf8' : '#64748b',
          boxShadow: sel===c.v ? '0 0 0 1px rgba(129,140,248,0.3)' : 'none',
        }}>
          {c.l}
        </button>
      ))}
    </div>
  );
}

/* ─── Section Tag ──────────────────────────────────────────────────────── */
export function SectionTag({ section }) {
  const s = SECTIONS[section];
  if (!s) return null;
  return (
    <span style={{ ...tagStyle, background:`${s.color}18`, color:s.color,
      border:`1px solid ${s.color}30` }}>
      {s.short}
    </span>
  );
}

/* ─── Cuota Tag ────────────────────────────────────────────────────────── */
export function CuotaTag({ current, total }) {
  if (!total || total <= 1) return null;
  return (
    <span style={{ ...tagStyle, background:'rgba(99,102,241,0.12)', color:'#818cf8',
      border:'1px solid rgba(129,140,248,0.2)' }}>
      {current}/{total}
    </span>
  );
}

/* ─── Emoji Picker ─────────────────────────────────────────────────────── */
export function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(null);
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;

  useEffect(() => {
    if (!open || picker) return;
    Promise.all([
      import('@emoji-mart/react'),
      import('@emoji-mart/data'),
    ]).then(([{ default: Picker }, { default: data }]) => {
      setPicker({ Picker, data });
    });
  }, [open]);

  // perLine en mobile se calcula para que el picker llene el ancho disponible
  // emoji-mart usa 36px por botón + ~24px de padding interno
  const mobilePerLine = typeof window !== 'undefined'
    ? Math.max(6, Math.floor((window.innerWidth - 24) / 36))
    : 8;

  const pickerNode = picker ? (
    <picker.Picker
      data={picker.data}
      onEmojiSelect={(e) => { onChange(e.native); setOpen(false); }}
      theme="dark"
      locale="es"
      previewPosition="none"
      skinTonePosition="none"
      searchPosition="sticky"
      maxFrequentRows={2}
      perLine={isDesktop ? 9 : mobilePerLine}
      set="native"
    />
  ) : (
    <div style={{ fontSize:12, color:'#5c5c72', padding:24 }}>Cargando...</div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width:42, height:42, borderRadius:10,
          border:`1.5px solid ${open ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.09)'}`,
          background: open ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)',
          fontSize:22, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          transition:'all 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
        }}
      >
        {value || '📎'}
      </button>

      {open && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.5)' }} />

          {isDesktop ? (
            /* Desktop: modal centrado */
            <div style={{
              position:'fixed', zIndex:10000,
              top:'50%', left:'50%', transform:'translate(-50%, -50%)',
              background:'#13131f', borderRadius:16,
              border:'1px solid rgba(255,255,255,0.1)',
              boxShadow:'0 24px 64px rgba(0,0,0,0.8)',
              overflow:'hidden',
            }}>
              {pickerNode}
            </div>
          ) : (
            /* Mobile: bottom sheet sobre la nav bar */
            <div style={{
              position:'fixed', bottom:'calc(63px + env(safe-area-inset-bottom, 0px))', left:0, right:0, zIndex:10000,
              background:'#13131f', borderRadius:'20px 20px 0 0',
              border:'1px solid rgba(255,255,255,0.08)',
              boxShadow:'0 -8px 40px rgba(0,0,0,0.5)',
              maxHeight:'70vh', display:'flex', flexDirection:'column',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8e8f0' }}>Elegir ícono</div>
                <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'#6c6c84', fontSize:22, cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
              </div>
              <div style={{ overflowY:'auto', flexGrow:1 }}>{pickerNode}</div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
