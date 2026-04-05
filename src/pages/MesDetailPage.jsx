import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonthDetail } from '@/hooks/analytics/useMonthDetail';
import { useStore } from '@/stores/useStore';
import { Pnl, ST } from '@/components/ui/Shared';
import { Mn } from '@/utils/money';
import { MONTHS_FULL, COLORS } from '@/utils/constants';
import { tooltipStyle, tooltipLabel, tooltipItem, tooltipWrapper, tooltipCursor } from '@/utils/styles';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function fmtMonthTitle(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTHS_FULL[month - 1]} ${year}`;
}

export function MesDetailPage({ month }) {
  const navigate  = useNavigate();
  const loadingYear = useStore(s => s.loadingYear);
  const { ingresoNeto, totalExpenses, disponible, rubroData, sectionData, expenses } = useMonthDetail(month);

  const [search, setSearch] = useState('');

  const sorted = useMemo(() =>
    [...expenses]
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .filter(t => !search || (t.item_name || t.description || '').toLowerCase().includes(search.toLowerCase())),
    [expenses, search]
  );

  return (
    <div style={{ padding: '0 16px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, marginBottom: 4 }}>
        <button
          onClick={() => navigate(-1)}
          data-testid="back-btn"
          style={{ background: 'none', border: 'none', color: '#6c6c84', fontSize: 18, cursor: 'pointer', padding: '4px 8px 4px 0', lineHeight: 1 }}
          title="Volver"
        >←</button>
        <ST>{fmtMonthTitle(month)}</ST>
      </div>

      {/* Summary cards */}
      {(() => {
        const dispColor = disponible >= 0 ? '#2dd4a8' : '#f06070';
        const cc = (c) => ({
          background: `linear-gradient(135deg, ${c}12 0%, rgba(255,255,255,0.02) 100%)`,
          borderRadius: 14, padding: '14px 16px',
          border: `1px solid ${c}30`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        });
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={cc('#2dd4a8')} data-testid="card-ingreso">
              <div style={{ fontSize: 10, color: '#2dd4a880', fontWeight: 600, textTransform: 'uppercase' }}>Ingreso Neto</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#2dd4a8', marginTop: 2 }}>{Mn.short(ingresoNeto)}</div>
              <div style={{ fontSize: 9, color: '#5c5c72' }}>{Mn.fmt(ingresoNeto)}</div>
            </div>
            <div style={cc('#f0a848')} data-testid="card-gastado">
              <div style={{ fontSize: 10, color: '#f0a84880', fontWeight: 600, textTransform: 'uppercase' }}>Gastado</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f0a848', marginTop: 2 }}>{Mn.short(totalExpenses)}</div>
              <div style={{ fontSize: 9, color: '#5c5c72' }}>{expenses.length} gastos</div>
            </div>
            <div style={cc(dispColor)} data-testid="card-disponible">
              <div style={{ fontSize: 10, color: `${dispColor}80`, fontWeight: 600, textTransform: 'uppercase' }}>Disponible</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: dispColor, marginTop: 2 }}>{Mn.short(disponible)}</div>
              <div style={{ fontSize: 9, color: '#5c5c72' }}>{disponible >= 0 ? 'Sobrante' : 'Déficit'}</div>
            </div>
          </div>
        );
      })()}

      {/* Charts */}
      <style>{`
        .mes-charts { display:flex; flex-direction:column; gap:14px; }
        @media (min-width:768px) { .mes-charts { display:grid; grid-template-columns:1fr 1fr; } }
      `}</style>
      <div className="mes-charts">

        {rubroData.length > 0 && (
          <Pnl title="Por categoría">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={rubroData} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none">
                  {rubroData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabel}
                  itemStyle={tooltipItem}
                  wrapperStyle={tooltipWrapper}
                  cursor={tooltipCursor}
                  formatter={(v, name) => [Mn.fmt(v), name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', justifyContent: 'center', marginTop: 4 }}>
              {rubroData.slice(0, 8).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#a0a0b8' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                  {r.name}
                </div>
              ))}
            </div>
          </Pnl>
        )}

        {sectionData.length > 0 && (
          <Pnl title="Por sección">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
              {sectionData.map(s => (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: '#e8e8f0', fontWeight: 700 }}>{Mn.fmt(s.total)}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: s.color,
                      width: `${Math.min((s.total / totalExpenses) * 100, 100)}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Pnl>
        )}
      </div>

      {/* Transaction list */}
      <ST color="#7c6cf0">Detalle de Gastos</ST>
      <p style={{ fontSize: 11, color: '#5c5c72', marginBottom: 12, marginTop: 0 }}>Todos los gastos con tarjeta de crédito del mes.</p>
      <input
        type="text"
        placeholder="Buscar gasto..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e8e8f0', fontSize: 13, outline: 'none', marginBottom: 10 }}
      />
      {loadingYear && expenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="ft-spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: '#5c5c72' }}>Cargando datos del año...</div>
        </div>
      ) : sorted.length > 0 ? (
        <div>
          <div style={{ fontSize: 11, color: '#5c5c72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {sorted.length} movimientos
          </div>
          {sorted.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.item_name || t.description || 'Sin nombre'}
                </div>
                <div style={{ fontSize: 10, color: '#5c5c72', marginTop: 2 }}>
                  {t.section || 'OTROS'}
                  {t.categories?.name && ` · ${t.categories.name}`}
                  {t.installment_total > 1 && ` · cuota ${t.installment_current}/${t.installment_total}`}
                  {' · '}{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('es-AR')}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8f0', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {Mn.fmt(t.amount_cents)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5c5c72' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#8888a0' }}>Sin gastos en este mes</div>
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}
