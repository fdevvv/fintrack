import { useEffect, useState, useRef } from 'react';
import { inputStyle, cardStyle, tagStyle } from '@/utils/styles';
import { SECTIONS, RUBRO_EMOJI, getSubIcon } from '@/utils/constants';

export function ST({ children, color = '#7c6cf0' }) {
  return <h2 style={{ fontSize:16,fontWeight:800,color:'#e8e8f0',margin:'24px 0 16px',paddingLeft:12,borderLeft:`3px solid ${color}` }}>{children}</h2>;
}

export function Inp({ label, value, onChange, placeholder, type = 'text', inputMode: im, style: extra }) {
  return (
    <div style={{ marginBottom:12, ...extra }}>
      {label && <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c7280',marginBottom:5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={im ?? (type==='number'?'numeric':undefined)} style={inputStyle} />
    </div>
  );
}

export function Sel({ label, value, onChange, options, style: extra }) {
  return (
    <div style={{ marginBottom:12, ...extra }}>
      {label && <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c7280',marginBottom:5 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle,appearance:'none',WebkitAppearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32 }}>
        {options.map((o,i) => <option key={i} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

export function Btn({ children, color, onClick, disabled, style: s }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:'100%',padding:12,borderRadius:12,border:'none',background:disabled?'#2a2a3a':color,color:'#fff',fontSize:14,fontWeight:700,cursor:disabled?'default':'pointer',marginBottom:12,opacity:disabled?0.5:1,transition:'all .15s',...s }}>
      {children}
    </button>
  );
}

export function Pnl({ title, children }) {
  return (
    <div style={{ ...cardStyle,marginBottom:14,padding:16 }}>
      <h3 style={{ fontSize:13,fontWeight:700,color:'#8888a0',margin:'0 0 14px',textTransform:'uppercase',letterSpacing:'0.5px' }}>{title}</h3>
      {children}
    </div>
  );
}

export function Divider() {
  return <hr style={{ border:'none',borderTop:'1px solid rgba(255,255,255,0.05)',margin:'20px 0' }} />;
}

export function Toast({ toast, onClear }) {
  useEffect(() => { if (toast) { const t = setTimeout(onClear, 3000); return () => clearTimeout(t); } }, [toast]);
  if (!toast) return null;
  return (
    <div style={{ position:'fixed',bottom:90,left:'50%',transform:'translateX(-50%)',background:toast.e?'#f06070':'#2dd4a8',color:toast.e?'#fff':'#0a0a12',padding:'10px 20px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 8px 32px rgba(0,0,0,0.4)',maxWidth:'90vw',textAlign:'center' }}>
      {toast.m}
    </div>
  );
}

export function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:20 }} onClick={onCancel}>
      <div style={{ background:'#14141e',borderRadius:16,padding:24,maxWidth:360,width:'100%',border:'1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,color:'#e8e8f0',marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13,color:'#8888a0',lineHeight:1.5,marginBottom:20 }}>{message}</div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#8888a0',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex:1,padding:10,borderRadius:10,border:'none',background:'#f06070',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export function InstallmentDeleteModal({ show, item, onDeleteOne, onDeleteAll, onCancel }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:20 }} onClick={onCancel}>
      <div style={{ background:'#14141e',borderRadius:16,padding:24,maxWidth:360,width:'100%',border:'1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,color:'#e8e8f0',marginBottom:6 }}>Eliminar cuota</div>
        <div style={{ fontSize:13,color:'#8888a0',lineHeight:1.5,marginBottom:20 }}>
          <span style={{ color:'#e8e8f0',fontWeight:600 }}>{item?.item_name}</span> tiene {item?.installment_total} cuotas. ¿Qué querés eliminar?
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          <button onClick={onDeleteOne} style={{ padding:'11px 16px',borderRadius:10,border:'1px solid rgba(240,96,112,0.3)',background:'rgba(240,96,112,0.08)',color:'#f06070',fontSize:13,fontWeight:600,cursor:'pointer',textAlign:'left' }}>
            Solo la cuota {item?.installment_current}/{item?.installment_total}
            <span style={{ display:'block',fontSize:11,color:'#8888a0',fontWeight:400,marginTop:2 }}>Las otras cuotas se mantienen</span>
          </button>
          <button onClick={onDeleteAll} style={{ padding:'11px 16px',borderRadius:10,border:'none',background:'#f06070',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',textAlign:'left' }}>
            Eliminar todas las cuotas
            <span style={{ display:'block',fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:400,marginTop:2 }}>Se borran las {item?.installment_total} cuotas</span>
          </button>
          <button onClick={onCancel} style={{ padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#8888a0',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export function ItemIcon({ item }) {
  const catName = item.categories?.name || item.category_name || '';
  if (catName === 'Suscripciones') {
    const svg = getSubIcon(item.item_name);
    if (svg) return <div style={{ width:40,height:40,borderRadius:10,overflow:'hidden',flexShrink:0 }} dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <div style={{ width:40,height:40,borderRadius:10,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
      {RUBRO_EMOJI[catName] || item.categories?.icon || '📎'}
    </div>
  );
}

export function MonthBar({ sel, onSel }) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return (
    <div style={{ display:'flex',gap:6,flexWrap:'wrap',padding:'0 0 8px' }}>
      {[{ l:'Todos', v:-1 }, ...months.map((m,i) => ({ l:m, v:i }))].map(c => (
        <button key={c.v} onClick={() => onSel(c.v)} style={{ padding:'6px 12px',borderRadius:20,border:'none',fontSize:12,fontWeight:600,background:sel===c.v?'#7c6cf0':'rgba(255,255,255,0.05)',color:sel===c.v?'#fff':'#6c7280',cursor:'pointer',whiteSpace:'nowrap',transition:'all .2s' }}>
          {c.l}
        </button>
      ))}
    </div>
  );
}

export function SectionTag({ section }) {
  const s = SECTIONS[section];
  if (!s) return null;
  return <span style={{ ...tagStyle, fontSize:10, background:`${s.color}20`, color:s.color }}>{s.short}</span>;
}

export function CuotaTag({ current, total }) {
  if (!total || total <= 1) return null;
  return <span style={{ ...tagStyle, fontSize:10, background:'rgba(124,108,240,0.12)', color:'#a8a0f8' }}>Cuota {current}/{total}</span>;
}

const EMOJI_OPTS = [
  // Compras & Ropa
  '🛒','👕','👗','👟','👜','💄','🧴','🧥','🎁','🛍️','🩴','👒','🕶️',
  // Comida & Delivery
  '🥩','🥬','🍕','🍔','🥗','🛵','☕','🍰','🍻','🥤','🧃','🍱','🥐','🌮',
  // Transporte
  '🚗','⛽','🚌','✈️','🚕','🚲','🛺','🚂','🚐',
  // Salud & Bienestar
  '💊','🏥','🦷','🧘','🏋️','🩺','🧬','👓',
  // Hogar & Servicios
  '🏠','💡','🔧','📦','🧹','🛁','🌿','🔑','🪴',
  // Ocio & Entretenimiento
  '🎮','🎬','🎵','📚','🎟️','⚽','🎲','🎯','🎸','🎤','🎨','🎭',
  // Finanzas
  '💳','🏦','💰','💵','🪙','📈','📊','🔐','💹',
  // Tech & Suscripciones
  '🔌','📱','💻','🎧','📺','📰','🎓','📡','🖥️','⌚',
  // Mascotas & Familia
  '🐕','🐱','👶','🌍',
  // Misc
  '⭐','🌟','🎯','❓','📎','🗂️','🏆','🎪','🧩',
];

export function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = search
    ? EMOJI_OPTS.filter(e => e.includes(search))
    : EMOJI_OPTS;

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width:44, height:44, borderRadius:10,
        border:`2px solid ${open ? '#7c6cf0' : 'rgba(255,255,255,0.1)'}`,
        background:'rgba(255,255,255,0.05)', fontSize:22, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        {value || '📎'}
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:300,
          background:'#14141e', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:14, padding:10, width:272,
          boxShadow:'0 12px 40px rgba(0,0,0,0.6)',
        }}>
          <input
            autoFocus
            placeholder="Buscar emoji..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width:'100%', boxSizing:'border-box', marginBottom:8,
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'6px 10px', fontSize:16, color:'#e8e8f0', outline:'none',
            }}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:3, maxHeight:200, overflowY:'auto' }}>
            {filtered.map(e => (
              <button key={e} type="button" onClick={() => { onChange(e); setOpen(false); setSearch(''); }}
                style={{
                  background: value === e ? 'rgba(124,108,240,0.35)' : 'transparent',
                  border:'none', borderRadius:6, fontSize:20, padding:'4px 2px',
                  cursor:'pointer', lineHeight:1, transition:'background .1s',
                }}>
                {e}
              </button>
            ))}
            {filtered.length === 0 && (
              <span style={{ gridColumn:'1/-1', fontSize:11, color:'#6c7280', padding:'8px 0', textAlign:'center' }}>Sin resultados</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
