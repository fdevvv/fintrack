import { useState, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { SECTIONS } from '@/utils/constants';
import { cardStyle, inputStyle } from '@/utils/styles';
import { categoriesService } from '@/services/categories.service';
import { ST, Btn, Inp, ConfirmModal, EmojiPicker } from '@/components/ui/Shared';

export function ConfigPage() {
  const { categories, loadAll, transactions, income, year, userSections, addSection, updateSection, removeSection } = useStore();
  const { showToast } = useUiStore();
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [delTarget, setDelTarget] = useState(null);
  const [editSecKey, setEditSecKey] = useState(null);
  const [editSecLabel, setEditSecLabel] = useState('');
  const [delSecTarget, setDelSecTarget] = useState(null);
  const [newCardName, setNewCardName] = useState('');
  const [showNewCard, setShowNewCard] = useState(false);

  // Migrar secciones legacy (de transacciones) a user_sections si aún no están guardadas
  useEffect(() => {
    if (!transactions.length) return;
    const savedKeys = new Set(userSections.map(s => s.key));
    const legacyKeys = [...new Set(transactions.filter(t => t.section).map(t => t.section))];
    const toMigrate = legacyKeys.filter(k => !savedKeys.has(k));
    toMigrate.forEach(k => {
      const label = SECTIONS[k]?.label || k;
      addSection(k, label, ['VISA','MASTERCARD'].includes(k)).catch(() => {});
    });
  }, [transactions, userSections]);

  const expCats = categories.filter(c => c.type === 'expense');
  const incCats = categories.filter(c => c.type === 'income');

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || '📎');
  };

  const saveEdit = async () => {
    if (!editName.trim()) { showToast('Nombre vacío', true); return; }
    try {
      await categoriesService.update(editId, { name: editName.trim(), icon: editIcon });
      showToast('✓ Rubro actualizado');
      setEditId(null);
      await loadAll();
    } catch (err) { showToast(err.message || 'Error', true); }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    try {
      await categoriesService.delete(delTarget.id);
      showToast('✓ Rubro eliminado');
      await loadAll();
    } catch (err) { showToast(err.message || 'Error', true); }
    setDelTarget(null);
  };

  const renderCategory = (cat) => {
    const isEditing = editId === cat.id;

    if (isEditing) {
      return (
        <div key={cat.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <EmojiPicker value={editIcon} onChange={setEditIcon} />
          <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 16 }} />
          <button onClick={saveEdit} style={{ background: '#2dd4a8', border: 'none', color: '#0a0a12', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>✓</button>
          <button onClick={() => setEditId(null)} style={{ background: 'none', border: 'none', color: '#5c5c72', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
      );
    }

    return (
      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{cat.icon || '📎'}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#e8e8f0' }}>{cat.name}</span>
        {cat.is_default && <span style={{ fontSize: 9, color: '#5c5c72', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}>default</span>}
        <button onClick={() => startEdit(cat)} style={{ background: 'none', border: 'none', color: '#7c6cf0', fontSize: 12, cursor: 'pointer', padding: '4px' }}>✏️</button>
        {!cat.is_default && <button onClick={() => setDelTarget(cat)} style={{ background: 'none', border: 'none', color: '#f06070', fontSize: 12, cursor: 'pointer', padding: '4px', opacity: 0.7 }}>🗑</button>}
      </div>
    );
  };

  const handleUpdateSection = async () => {
    const label = editSecLabel.trim();
    if (!label) return;
    try {
      await updateSection(editSecKey, label);
      setEditSecKey(null);
      showToast('✓ Sección actualizada');
    } catch (e) { showToast(e.message || 'Error', true); }
  };

  const handleRemoveSection = async () => {
    if (!delSecTarget) return;
    try {
      await removeSection(delSecTarget.key);
      showToast(`✓ "${delSecTarget.label}" eliminada`);
    } catch (e) { showToast(e.message || 'Error', true); }
    setDelSecTarget(null);
  };

  const handleCreateCard = async () => {
    const name = newCardName.trim();
    if (!name) return;
    const key = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    try {
      await addSection(key, name, true);
      setNewCardName('');
      setShowNewCard(false);
      showToast(`✓ "${name}" creada`);
    } catch (e) { showToast(e.message || 'Error', true); }
  };

  const cards = userSections.filter(s => s.is_card);
  const otherSections = userSections.filter(s => !s.is_card);

  return (
    <div style={{ padding: '0 16px', maxWidth: 600, margin: '0 auto' }}>
      <ST color="#8888a0">Gestión de Rubros</ST>
      <p style={{ fontSize: 11, color: '#5c5c72', marginBottom: 16 }}>Editá, eliminá o reorganizá tus categorías. Los cambios se reflejan en toda la app.</p>

      <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#8888a0', marginBottom: 10, textTransform: 'uppercase' }}>Gastos ({expCats.length})</h3>
        {expCats.map(renderCategory)}
      </div>

      {incCats.length > 0 && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#8888a0', marginBottom: 10, textTransform: 'uppercase' }}>Ingresos ({incCats.length})</h3>
          {incCats.map(renderCategory)}
        </div>
      )}

      <ST color="#60a8f0">Tarjetas</ST>
      <p style={{ fontSize: 11, color: '#5c5c72', marginBottom: 16 }}>Tarjetas disponibles para importar resúmenes y registrar gastos.</p>

      <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
        {cards.length === 0 && !showNewCard && (
          <p style={{ fontSize: 12, color: '#5c5c72', marginBottom: 8 }}>No hay tarjetas creadas. Podés crearlas acá o desde la página de Importar.</p>
        )}
        {cards.map((s, idx) => (
          <div key={s.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom: idx < cards.length - 1 || showNewCard ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            {editSecKey === s.key ? (
              <>
                <input value={editSecLabel} onChange={e => setEditSecLabel(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleUpdateSection(); if (e.key==='Escape') setEditSecKey(null); }} autoFocus
                  style={{ ...inputStyle, flex:1, padding:'6px 10px', fontSize:16 }} />
                <button onClick={handleUpdateSection} style={{ background:'#60a8f0', border:'none', color:'#fff', fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:6, cursor:'pointer' }}>✓</button>
                <button onClick={() => setEditSecKey(null)} style={{ background:'none', border:'none', color:'#5c5c72', fontSize:14, cursor:'pointer' }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ fontSize:16, width:24, textAlign:'center', flexShrink:0 }}>💳</span>
                <span style={{ flex:1, fontSize:13, fontWeight:500, color:'#e8e8f0' }}>{s.label}</span>
                <button onClick={() => { setEditSecKey(s.key); setEditSecLabel(s.label); }} style={{ background:'none', border:'none', color:'#60a8f0', fontSize:12, cursor:'pointer', padding:'4px' }}>✏️</button>
                <button onClick={() => setDelSecTarget(s)} style={{ background:'none', border:'none', color:'#f06070', fontSize:12, cursor:'pointer', padding:'4px', opacity:0.7 }}>🗑</button>
              </>
            )}
          </div>
        ))}
        {showNewCard ? (
          <div style={{ display:'flex', gap:6, marginTop: cards.length ? 10 : 0, alignItems:'center' }}>
            <input value={newCardName} onChange={e => setNewCardName(e.target.value)} placeholder="Ej: Naranja X" autoFocus
              onKeyDown={e => { if (e.key==='Enter') handleCreateCard(); if (e.key==='Escape') { setShowNewCard(false); setNewCardName(''); } }}
              style={{ ...inputStyle, flex:1, padding:'8px 12px', fontSize:16 }} />
            <button onClick={handleCreateCard} style={{ background:'#60a8f0', border:'none', color:'#fff', fontSize:12, fontWeight:700, padding:'9px 14px', borderRadius:8, cursor:'pointer', whiteSpace:'nowrap' }}>Crear</button>
            <button onClick={() => { setShowNewCard(false); setNewCardName(''); }} style={{ background:'none', border:'none', color:'#5c5c72', fontSize:18, cursor:'pointer', padding:'0 4px', lineHeight:1 }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowNewCard(true)}
            style={{ marginTop: cards.length ? 10 : 0, background:'none', border:'1px dashed rgba(96,168,240,0.3)', color:'#60a8f0', fontSize:12, fontWeight:600, padding:'8px 14px', borderRadius:8, cursor:'pointer', width:'100%' }}>
            + Nueva tarjeta
          </button>
        )}
      </div>

      {otherSections.length > 0 && (
        <>
          <ST color="#7c6cf0">Otras Secciones</ST>
          <p style={{ fontSize: 11, color: '#5c5c72', marginBottom: 16 }}>Secciones de efectivo, débito u otras formas de pago.</p>
          <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
            {otherSections.map((s, idx) => (
              <div key={s.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom: idx < otherSections.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                {editSecKey === s.key ? (
                  <>
                    <input value={editSecLabel} onChange={e => setEditSecLabel(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleUpdateSection(); if (e.key==='Escape') setEditSecKey(null); }} autoFocus
                      style={{ ...inputStyle, flex:1, padding:'6px 10px', fontSize:16 }} />
                    <button onClick={handleUpdateSection} style={{ background:'#7c6cf0', border:'none', color:'#fff', fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:6, cursor:'pointer' }}>✓</button>
                    <button onClick={() => setEditSecKey(null)} style={{ background:'none', border:'none', color:'#5c5c72', fontSize:14, cursor:'pointer' }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex:1, fontSize:13, fontWeight:500, color:'#e8e8f0' }}>{s.label}</span>
                    <button onClick={() => { setEditSecKey(s.key); setEditSecLabel(s.label); }} style={{ background:'none', border:'none', color:'#7c6cf0', fontSize:12, cursor:'pointer', padding:'4px' }}>✏️</button>
                    <button onClick={() => setDelSecTarget(s)} style={{ background:'none', border:'none', color:'#f06070', fontSize:12, cursor:'pointer', padding:'4px', opacity:0.7 }}>🗑</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', marginBottom: 8 }}>FinTrack v2.0</div>
        <div style={{ fontSize: 11, color: '#5c5c72', lineHeight: 1.6 }}>Control inteligente de gastos con tarjetas, cuotas, USD, importación de PDF y más.</div>
      </div>

      <ConfirmModal show={!!delTarget} title="Eliminar rubro" message={delTarget ? `¿Eliminar "${delTarget.name}"? Los gastos asociados quedarán sin categoría.` : ''} onConfirm={confirmDelete} onCancel={() => setDelTarget(null)} />
      <ConfirmModal show={!!delSecTarget} title="Eliminar sección" message={delSecTarget ? `¿Eliminar "${delSecTarget.label}"?` : ''} onConfirm={handleRemoveSection} onCancel={() => setDelSecTarget(null)} />
      <div style={{ height: 80 }} />
    </div>
  );
}
