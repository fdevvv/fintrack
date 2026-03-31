import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonthlyIncomeHistory } from '@/hooks/income/useMonthlyIncomeHistory';
import { useAuth } from '@/hooks/auth/useAuth';
import { monthlyIncomeService } from '@/services/monthlyIncome.service';
import { Pnl } from '@/components/ui/Shared';
import { Mn } from '@/utils/money';
import { MONTHS } from '@/utils/constants';

function fmtMonthKey(key) {
  const [year, month] = key.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

function calcPct(current, previous) {
  if (previous == null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (!isFinite(pct) || isNaN(pct)) return null;
  return Math.round(pct * 10) / 10;
}

function PctBadge({ pct }) {
  if (pct === null) return <span style={{ color: '#3c3c54', fontSize: 11 }}>—</span>;
  const color = pct > 0 ? '#2dd4a8' : pct < 0 ? '#f06070' : '#6c6c84';
  return <span style={{ fontSize: 11, fontWeight: 600, color }}>{(pct > 0 ? '+' : '') + pct + '%'}</span>;
}

function SkeletonRows({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ height: 12, width: 72, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ height: 10, width: 28, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ height: 12, width: 60, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  ));
}

const INLINE_INPUT = {
  width: 110, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(124,108,240,0.4)', borderRadius: 8,
  padding: '4px 8px', fontSize: 13, fontWeight: 600, color: '#e8e8f0', outline: 'none',
};
const BTN_SAVE   = { background: '#2dd4a8', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#0a0a12', cursor: 'pointer' };
const BTN_CANCEL = { background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#6c6c84', cursor: 'pointer' };

export function MonthlyIncomeHistory() {
  const navigate = useNavigate();
  const { rows, loading, updateRow } = useMonthlyIncomeHistory();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Próximos 6 meses que aún no tienen registro
  const upcomingKeys = useMemo(() => {
    const keys = [];
    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys.filter(k => !rows.some(r => r.month === k));
  }, [rows]);

  const [editingMonth, setEditingMonth] = useState(null);
  const [inputVal,     setInputVal]     = useState('');
  const [saving,       setSaving]       = useState(false);

  const startEdit   = useCallback((row)   => { setEditingMonth(row.month); setInputVal(String(row.amount || '')); }, []);
  const startAdd    = useCallback((month) => { setEditingMonth(month);     setInputVal(''); }, []);
  const cancelEdit  = useCallback(() => setEditingMonth(null), []);

  const handleSave = useCallback(async (month) => {
    const n = Number(inputVal);
    if (!isFinite(n) || isNaN(n) || n < 0) return;
    setSaving(true);
    try {
      const saved = await monthlyIncomeService.upsertMonthlyIncome(userId, month, n);
      updateRow(month, saved ?? n);
      setEditingMonth(null);
    } catch { /* mantiene valor anterior */ }
    finally { setSaving(false); }
  }, [inputVal, userId, updateRow]);

  const handleKey = useCallback((e, month) => {
    if (e.key === 'Enter')  handleSave(month);
    if (e.key === 'Escape') cancelEdit();
  }, [handleSave, cancelEdit]);

  const renderEditControls = (month) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
      <input
        type="number" value={inputVal} autoFocus min="0" step="1"
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={e => handleKey(e, month)}
        data-testid={`input-${month}`}
        style={INLINE_INPUT}
      />
      <button onClick={() => handleSave(month)} disabled={saving} data-testid={`save-${month}`} style={{ ...BTN_SAVE, opacity: saving ? 0.5 : 1 }}>
        {saving ? '…' : '✓'}
      </button>
      <button onClick={cancelEdit} data-testid={`cancel-${month}`} style={BTN_CANCEL}>✕</button>
    </div>
  );

  return (
    <Pnl title="Ingreso neto mensual">
      {loading ? (
        <SkeletonRows />
      ) : (
        <>
          {rows.length === 0 && upcomingKeys.length === 0 && (
            <p style={{ fontSize: 12, color: '#3c3c54', margin: 0 }}>Sin datos disponibles.</p>
          )}

          {/* Meses con datos */}
          {rows.map((row, i) => {
            const isCurrent = row.month === currentMonthKey;
            const isEditing = editingMonth === row.month;
            return (
              <div key={row.month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: isCurrent ? 'rgba(124,108,240,0.05)' : 'transparent' }}>
                <span
                  onClick={() => navigate(`/mes/${row.month}`)}
                  style={{ fontSize: 13, color: isCurrent ? '#e8e8f0' : '#8888a0', fontWeight: isCurrent ? 600 : 400, minWidth: 72, cursor: 'pointer' }}
                  title="Ver detalle del mes"
                >
                  {fmtMonthKey(row.month)}
                </span>
                {isEditing ? renderEditControls(row.month) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <PctBadge pct={calcPct(row.amount, rows[i - 1]?.amount ?? null)} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', minWidth: 70, textAlign: 'right' }}>
                      {Mn.fmt(row.amount)}
                    </span>
                    <button onClick={() => startEdit(row)} data-testid={`edit-${row.month}`} style={{ background: 'none', border: 'none', color: '#3c3c54', fontSize: 13, cursor: 'pointer', padding: '2px 4px' }} title="Editar">✏️</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Próximos meses sin registro */}
          {upcomingKeys.length > 0 && (
            <div style={{ marginTop: rows.length > 0 ? 6 : 0 }}>
              {upcomingKeys.map(month => (
                <div key={month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span
                    onClick={() => navigate(`/mes/${month}`)}
                    style={{ fontSize: 13, color: '#5c5c72', minWidth: 72, cursor: 'pointer' }}
                    title="Ver detalle del mes"
                  >{fmtMonthKey(month)}</span>
                  {editingMonth === month ? renderEditControls(month) : (
                    <button onClick={() => startAdd(month)} data-testid={`add-${month}`} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#5c5c72', cursor: 'pointer' }}>
                      + Agregar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Pnl>
  );
}
