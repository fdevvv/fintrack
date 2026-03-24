import { useState, useRef } from 'react';
import { ticketService } from '@/services/tickets.service';
import { Mn } from '@/utils/money';
import { inputStyle, cardStyle } from '@/utils/styles';
import { Btn } from '@/components/ui/Shared';

export function TicketScanner({ onConfirm, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setItems([]);
    setTotal(0);
    setError('');
  };

  const processOCR = async () => {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const result = await ticketService.processOCR(file);
      if (!result.items.length) {
        setError('No se detectaron items. Podés agregarlos manualmente.');
      }
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError('Error procesando imagen: ' + err.message);
    }
    setProcessing(false);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === 'price' ? Math.round(Number(value) || 0) : value } : i));
  };

  const removeItem = (id) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      setTotal(next.reduce((s, i) => s + i.price, 0));
      return next;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { name: '', price: 0, id: crypto.randomUUID() }]);
  };

  const recalcTotal = () => {
    setTotal(items.reduce((s, i) => s + i.price, 0));
  };

  const handleConfirm = async () => {
    let imageUrl = null;
    if (file) {
      try { imageUrl = await ticketService.uploadImage(file); } catch (err) {
        setError('No se pudo subir la imagen. El gasto se guarda sin foto.');
      }
    }
    onConfirm({ items, total, imageUrl });
  };

  return (
    <div>
      {/* Upload area */}
      {!preview && (
        <div onClick={() => fileRef.current?.click()}
          style={{ border:'2px dashed rgba(255,255,255,0.1)',borderRadius:14,padding:'24px 16px',textAlign:'center',cursor:'pointer',marginBottom:12,background:'rgba(255,255,255,0.02)' }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div style={{ fontSize:28,marginBottom:6 }}>📸</div>
          <div style={{ fontSize:13,fontWeight:600,color:'#e8e8f0' }}>Cargar ticket</div>
          <div style={{ fontSize:11,color:'#5c5c72',marginTop:4 }}>Foto o imagen del ticket</div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ marginBottom:12 }}>
          <div style={{ position:'relative',borderRadius:10,overflow:'hidden',marginBottom:8 }}>
            <img src={preview} alt="Ticket" style={{ width:'100%',maxHeight:200,objectFit:'contain',borderRadius:10,background:'rgba(255,255,255,0.03)' }} />
            <button onClick={() => { setPreview(null); setFile(null); setItems([]); setTotal(0); }}
              style={{ position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',width:24,height:24,borderRadius:12,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
          {items.length === 0 && !processing && (
            <Btn color="#60a8f0" onClick={processOCR}>🔍 Procesar ticket (OCR)</Btn>
          )}
        </div>
      )}

      {/* Processing */}
      {processing && (
        <div style={{ textAlign:'center',padding:20 }}>
          <div className="ft-spinner" />
          <div style={{ fontSize:12,color:'#5c5c72',marginTop:10 }}>Leyendo ticket...</div>
        </div>
      )}

      {/* Error */}
      {error && <div style={{ padding:'8px 12px',borderRadius:10,fontSize:12,marginBottom:10,background:'rgba(240,168,72,0.12)',color:'#f0a848',border:'1px solid rgba(240,168,72,0.2)' }}>{error}</div>}

      {/* Editable items */}
      {(items.length > 0 || (preview && !processing)) && (
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <span style={{ fontSize:12,fontWeight:700,color:'#8888a0' }}>ITEMS DETECTADOS</span>
            <button onClick={addItem} style={{ background:'rgba(96,168,240,0.12)',border:'none',color:'#60a8f0',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,cursor:'pointer' }}>+ Agregar item</button>
          </div>

          {items.map((item) => (
            <div key={item.id} style={{ display:'flex',gap:8,alignItems:'center',marginBottom:6 }}>
              <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)}
                placeholder="Nombre" style={{ ...inputStyle, flex:1, padding:'8px 10px', fontSize:13 }} />
              <input value={item.price || ''} onChange={e => updateItem(item.id, 'price', e.target.value)}
                placeholder="$0" type="number" style={{ ...inputStyle, width:100, padding:'8px 10px', fontSize:13, textAlign:'right', fontFamily:'"JetBrains Mono",monospace' }} />
              <button onClick={() => removeItem(item.id)}
                style={{ background:'none',border:'none',color:'#f06070',fontSize:14,cursor:'pointer',padding:'4px',flexShrink:0,opacity:0.7 }}>✕</button>
            </div>
          ))}

          {/* Total */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',marginTop:4,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:13,fontWeight:700,color:'#e8e8f0' }}>Total</span>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <input value={total || ''} onChange={e => setTotal(Math.round(Number(e.target.value) || 0))}
                type="number" style={{ ...inputStyle, width:120, padding:'8px 10px', fontSize:14, textAlign:'right', fontWeight:700, fontFamily:'"JetBrains Mono",monospace' }} />
              <button onClick={recalcTotal} title="Recalcular sumando items"
                style={{ background:'rgba(124,108,240,0.12)',border:'none',color:'#a8a0f8',fontSize:11,fontWeight:700,padding:'6px 8px',borderRadius:6,cursor:'pointer' }}>Σ</button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex',gap:8,marginTop:10 }}>
            <button onClick={onCancel} style={{ flex:1,padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#8888a0',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancelar</button>
            <button onClick={handleConfirm} disabled={!total || total <= 0}
              style={{ flex:1,padding:10,borderRadius:10,border:'none',background:total>0?'#7c6cf0':'#2a2a3a',color:'#fff',fontSize:13,fontWeight:700,cursor:total>0?'pointer':'default',opacity:total>0?1:0.5 }}>
              Usar total {total > 0 ? Mn.fmt(total) : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
