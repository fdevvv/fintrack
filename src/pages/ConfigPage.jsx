import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { RUBRO_EMOJI } from '@/utils/constants';
import { cardStyle, inputStyle } from '@/utils/styles';
import { categoriesService } from '@/services/categories';
import { exportToExcel } from '@/services/export';
import { ST, Btn, Inp, ConfirmModal } from '@/components/ui/Shared';

export function ConfigPage() {
  const { categories, loadAll, showToast, transactions, income, year } = useStore();
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [delTarget, setDelTarget] = useState(null);

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
          <input value={editIcon} onChange={e => setEditIcon(e.target.value)} style={{ ...inputStyle, width: 50, padding: '6px 8px', fontSize: 18, textAlign: 'center' }} maxLength={2} />
          <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 13 }} />
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

      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', marginBottom: 8 }}>FinTrack v2.0</div>
        <div style={{ fontSize: 11, color: '#5c5c72', lineHeight: 1.6 }}>Control inteligente de gastos con tarjetas, cuotas, OCR de tickets, USD, importación de PDF y más.</div>
      </div>

      <ConfirmModal show={!!delTarget} title="Eliminar rubro" message={delTarget ? `¿Eliminar "${delTarget.name}"? Los gastos asociados quedarán sin categoría.` : ''} onConfirm={confirmDelete} onCancel={() => setDelTarget(null)} />
      <div style={{ height: 80 }} />
    </div>
  );
}
