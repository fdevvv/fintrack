import { useState } from 'react';
import { SECTIONS, COLORS, MONTHS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { tooltipStyle, tooltipLabel, tooltipItem, tooltipWrapper, tooltipCursor } from '@/utils/styles';
import { useDashboard } from '@/hooks/analytics/useDashboard';
import { useMonthComparison } from '@/hooks/analytics/useMonthComparison';
import { useMonthlyIncome } from '@/hooks/income/useMonthlyIncome';
import { useSavingsGoals } from '@/hooks/savings/useSavingsGoals';
import { MonthlyIncomeHistory } from '@/components/income/MonthlyIncomeHistory';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── Stat Card ────────────────────────────────────────────────────────── */
function StatCard({ card: c }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(e => !e)}
      title={c.f}
      style={{
        background: '#111219',
        borderRadius: 12,
        padding: '14px 16px',
        border: `1px solid ${c.c}25`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.4), inset 0 0 0 1px ${c.c}08`,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${c.c}45`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${c.c}25`; }}
    >
      {/* Subtle accent glow top-left */}
      <div style={{ position:'absolute',top:0,left:0,width:40,height:40,
        borderRadius:'0 0 40px 0',
        background:`radial-gradient(circle at 0 0, ${c.c}18 0%, transparent 70%)`,
        pointerEvents:'none' }} />

      <div style={{ fontSize:10,color:`${c.c}`,fontWeight:600,
        textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:8,
        opacity:0.7 }}>
        {c.l}
      </div>
      <div style={{
        fontSize: expanded ? 13 : 24,
        fontWeight: 800, color: c.c,
        letterSpacing: expanded ? 0 : '-0.5px',
        marginBottom: 4,
        cursor: 'pointer',
        transition: 'font-size 0.15s',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.1,
      }}>
        {expanded ? c.f : c.v}
      </div>
      <div style={{ fontSize:10,color:'#475569',fontWeight:500 }}>{c.s}</div>
    </div>
  );
}

/* ─── Quick chip ────────────────────────────────────────────────────────── */
function QuickChip({ label, value, color }) {
  return (
    <div style={{
      background: '#111219',
      border: `1px solid ${color}20`,
      borderRadius: 10,
      padding: '8px 14px',
      display: 'flex', flexDirection: 'column', gap: 3,
      minWidth: 90,
    }}>
      <span style={{ fontSize:9,fontWeight:600,color:'#475569',
        textTransform:'uppercase',letterSpacing:'0.5px' }}>{label}</span>
      <span style={{ fontSize:15,fontWeight:700,color,
        fontVariantNumeric:'tabular-nums',letterSpacing:'-0.3px' }}>{value}</span>
    </div>
  );
}

/* ─── Comparison cell ───────────────────────────────────────────────────── */
function CmpCell({ label, value, variation, color, loading }) {
  const varColor = variation > 0 ? '#34d399' : variation < 0 ? '#f87171' : '#475569';
  const varLabel = variation === 0 ? '—' : (variation > 0 ? '↑ +' : '↓ ') + Math.abs(variation) + '%';
  return (
    <div style={{
      background: '#111219',
      borderRadius: 10,
      padding: '12px 14px',
      border: `1px solid ${color}20`,
    }}>
      <div style={{ fontSize:10,color:`${color}`,fontWeight:600,
        textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6,opacity:0.7 }}>
        {label}
      </div>
      {loading ? (
        <>
          <div style={{ height:18,borderRadius:4,background:'rgba(255,255,255,0.06)',marginBottom:6 }} />
          <div style={{ height:11,width:'50%',borderRadius:3,background:'rgba(255,255,255,0.04)' }} />
        </>
      ) : (
        <>
          <div style={{ fontSize:15,fontWeight:800,color:'#e2e8f0',marginBottom:3,
            letterSpacing:'-0.3px',fontVariantNumeric:'tabular-nums' }}>
            {Mn.fmt(value)}
          </div>
          <div style={{ fontSize:11,fontWeight:600,color:varColor }}>{varLabel}</div>
        </>
      )}
    </div>
  );
}

/* ─── Alert Banner ──────────────────────────────────────────────────────── */
function AlertBanner({ type, message }) {
  const cfg = {
    danger:  { bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)', color:'#f87171', icon:'🚨' },
    warning: { bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)',  color:'#fbbf24', icon:'⚠️' },
    info:    { bg:'rgba(129,140,248,0.08)', border:'rgba(129,140,248,0.2)', color:'#818cf8', icon:'💡' },
  }[type] || {};
  return (
    <div style={{
      padding:'9px 14px', borderRadius:10, fontSize:12, fontWeight:500,
      marginBottom:6, background:cfg.bg, color:cfg.color,
      border:`1px solid ${cfg.border}`,
      display:'flex', alignItems:'flex-start', gap:8, lineHeight:1.5,
    }}>
      <span style={{ flexShrink:0 }}>{cfg.icon}</span>
      <span>{message}</span>
    </div>
  );
}

/* ─── Section label ─────────────────────────────────────────────────────── */
function SectionLabel({ children, action }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
      marginBottom:10,marginTop:20 }}>
      <span style={{ fontSize:12,fontWeight:700,color:'#64748b',
        textTransform:'uppercase',letterSpacing:'0.8px' }}>
        {children}
      </span>
      {action}
    </div>
  );
}

/* ─── Budget row ────────────────────────────────────────────────────────── */
function BudgetRow({ b, isLast }) {
  const pctColor = b.pct > 100 ? '#f87171' : b.pct > 80 ? '#fbbf24' : '#34d399';
  return (
    <div style={{ marginBottom: isLast ? 0 : 14 }}>
      <div style={{ display:'flex',justifyContent:'space-between',
        alignItems:'center',marginBottom:6 }}>
        <span style={{ fontSize:12,fontWeight:600,color:'#e2e8f0',
          display:'flex',alignItems:'center',gap:6 }}>
          {RUBRO_EMOJI[b.rubro]||'📎'}
          <span>{b.rubro}</span>
        </span>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:11,color:'#64748b',fontVariantNumeric:'tabular-nums' }}>
            {Mn.fmt(b.spent)} / {Mn.fmt(b.limit)}
          </span>
          <span style={{ fontSize:10,fontWeight:700,color:pctColor,
            background:`${pctColor}15`, padding:'1px 6px',borderRadius:20 }}>
            {Math.round(b.pct)}%
          </span>
        </div>
      </div>
      <div style={{ height:5,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
        <div style={{ height:'100%',borderRadius:99,width:`${Math.min(b.pct,100)}%`,
          background:pctColor,transition:'width 0.6s ease-out' }} />
      </div>
    </div>
  );
}

/* ─── Savings goal row ─────────────────────────────────────────────────── */
function GoalRow({ g, isLast }) {
  const pct = g.target_amount > 0
    ? Math.min((g.saved_amount / g.target_amount) * 100, 100) : 0;
  const done = pct >= 100;
  return (
    <div style={{ marginBottom: isLast ? 0 : 16 }}>
      <div style={{ display:'flex',justifyContent:'space-between',
        alignItems:'center',marginBottom:6 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:28,height:28,borderRadius:8,
            background: done ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.12)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>
            {done ? '✅' : '🎯'}
          </div>
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:'#e2e8f0' }}>{g.name}</div>
            {g.deadline && (
              <div style={{ fontSize:10,color:'#475569' }}>Meta: {g.deadline}</div>
            )}
          </div>
        </div>
        <span style={{ fontSize:11,fontWeight:700,
          color: done ? '#34d399' : '#94a3b8',
          fontVariantNumeric:'tabular-nums' }}>
          {Mn.fmt(g.saved_amount)} / {Mn.fmt(g.target_amount)}
        </span>
      </div>
      <div style={{ height:5,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
        <div style={{ height:'100%',borderRadius:99,width:`${pct}%`,
          background: done ? '#34d399' : 'linear-gradient(90deg,#6366f1,#818cf8)',
          transition:'width 0.6s ease-out' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASH PAGE
═══════════════════════════════════════════════════════════════════════════ */
export function DashPage() {
  const {
    mo, sectionBarData, rubroData, rubroTotal,
    alerts, budgetEntries, incomeVsExpenseData, cards,
    todaySpent, weekSpent,
  } = useDashboard();
  const { goals } = useSavingsGoals();
  const { data: cmp, loading: cmpLoading } = useMonthComparison();
  const ttS = tooltipStyle;

  // Monthly income editor
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const { income: incomeValue, loading: incLoading, updateIncome } = useMonthlyIncome(monthKey);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal,  setInputVal]  = useState('');

  const fmtMoney = n => {
    const safe = isFinite(n) && !isNaN(n) ? Math.max(0,n) : 0;
    return '$' + safe.toLocaleString('es-AR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  };
  const startEdit  = () => { setInputVal(String(incomeValue || '')); setIsEditing(true); };
  const cancelEdit = () => setIsEditing(false);
  const handleSave = async () => {
    const n = Number(inputVal);
    if (!isFinite(n) || isNaN(n) || n < 0) return;
    await updateIncome(n);
    setIsEditing(false);
  };
  const handleKey = e => {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') cancelEdit();
  };

  const prevMonth = MONTHS[mo === 0 ? 11 : mo - 1];

  return (
    <div style={{ padding:'0 16px', maxWidth:980, margin:'0 auto' }}>
      <style>{`
        .dash-kpi  { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
        .dash-cmp  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .dash-charts { display:flex; flex-direction:column; gap:12px; }
        @media (min-width:768px) {
          .dash-kpi    { grid-template-columns:repeat(4,1fr); gap:10px; }
          .dash-charts { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        }
      `}</style>

      {/* ── KPI Cards ── */}
      <SectionLabel>{MONTHS[mo]} · resumen</SectionLabel>
      <div className="dash-kpi">
        {cards.map((c,i) => <StatCard key={i} card={c} />)}
      </div>

      {/* ── Quick chips ── */}
      <div style={{ display:'flex', gap:8, marginBottom:4, flexWrap:'wrap' }}>
        <QuickChip label="Hoy"         value={Mn.fmt(todaySpent)} color="#818cf8" />
        <QuickChip label="Esta semana" value={Mn.fmt(weekSpent)}  color="#60a5fa" />
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div style={{ marginTop:12 }}>
          {alerts.map((a,i) => (
            <AlertBanner key={i} type={a.t} message={a.m} />
          ))}
        </div>
      )}

      {/* ── Income editor ── */}
      <SectionLabel>Ingreso {MONTHS[mo]}</SectionLabel>
      <div style={{ background:'#111219',borderRadius:12,padding:'16px',
        border:'1px solid rgba(255,255,255,0.08)',marginBottom:4 }}>
        {incLoading && !isEditing ? (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ height:32,width:160,borderRadius:8,
              background:'rgba(255,255,255,0.05)',animation:'pulse 1.5s infinite' }} />
            <div style={{ height:32,width:36,borderRadius:8,
              background:'rgba(255,255,255,0.03)',animation:'pulse 1.5s infinite' }} />
          </div>
        ) : isEditing ? (
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <input
              type="number" value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKey} autoFocus min="0" step="1" placeholder="0"
              style={{ flex:1,background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(129,140,248,0.4)',
                boxShadow:'0 0 0 3px rgba(99,102,241,0.1)',
                borderRadius:10,padding:'9px 14px',
                fontSize:18,fontWeight:700,color:'#e2e8f0',outline:'none',
                fontVariantNumeric:'tabular-nums',
                fontFamily:"'Inter',system-ui,sans-serif" }}
            />
            <button onClick={handleSave} disabled={incLoading} style={{
              padding:'9px 16px',borderRadius:10,border:'none',
              background:'linear-gradient(135deg,#059669,#34d399)',
              color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
              opacity:incLoading?0.5:1,
            }}>{incLoading ? '…' : '✓'}</button>
            <button onClick={cancelEdit} style={{
              padding:'9px 12px',borderRadius:10,
              border:'1px solid rgba(255,255,255,0.08)',background:'transparent',
              color:'#64748b',fontSize:13,cursor:'pointer',
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:10,color:'#475569',fontWeight:600,
                textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:4 }}>
                Ingreso neto mensual
              </div>
              <span style={{ fontSize:28,fontWeight:800,color:'#34d399',
                letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums' }}>
                {fmtMoney(incomeValue)}
              </span>
            </div>
            <button onClick={startEdit} style={{
              padding:'8px 12px',borderRadius:10,
              border:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.04)',
              color:'#64748b',fontSize:13,cursor:'pointer',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color='#e2e8f0'; e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}>
              ✏️
            </button>
          </div>
        )}
      </div>

      {/* ── Monthly income history ── */}
      <MonthlyIncomeHistory />

      {/* ── Month comparison ── */}
      <SectionLabel>vs {prevMonth}</SectionLabel>
      <div className="dash-cmp" style={{ marginBottom:4 }}>
        {[
          { label:'Ingresos', key:'income',   color:'#34d399' },
          { label:'Gastos',   key:'expenses', color:'#f87171' },
          { label:'Balance',  key:'balance',  color:'#818cf8' },
        ].map(({ label, key, color }) => (
          <CmpCell key={key} label={label}
            value={cmp?.current?.[key] ?? 0}
            variation={cmp?.variation?.[key] ?? 0}
            color={color} loading={cmpLoading} />
        ))}
      </div>

      {/* ── Budget progress ── */}
      {budgetEntries.length > 0 && (
        <>
          <SectionLabel>Presupuestos · {MONTHS[mo]}</SectionLabel>
          <div style={{ background:'#111219',borderRadius:12,padding:'16px',
            border:'1px solid rgba(255,255,255,0.08)',marginBottom:4 }}>
            {budgetEntries.map((b,i) => (
              <BudgetRow key={i} b={b} isLast={i === budgetEntries.length-1} />
            ))}
          </div>
        </>
      )}

      {/* ── Savings goals ── */}
      {goals.length > 0 && (
        <>
          <SectionLabel>Metas de ahorro</SectionLabel>
          <div style={{ background:'#111219',borderRadius:12,padding:'16px',
            border:'1px solid rgba(255,255,255,0.08)',marginBottom:4 }}>
            {goals.map((g,i) => (
              <GoalRow key={g.id} g={g} isLast={i === goals.length-1} />
            ))}
          </div>
        </>
      )}

      {/* ── Charts ── */}
      <SectionLabel>Análisis</SectionLabel>
      <div className="dash-charts">
        {/* Bar: gasto por tarjeta */}
        <div style={{ background:'#111219',borderRadius:12,padding:'16px',
          border:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:10,fontWeight:700,color:'#475569',
            textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:12 }}>
            Gasto mensual por tarjeta
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={sectionBarData} margin={{ top:0,right:0,left:-14,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#64748b',fontSize:10 }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b',fontSize:10 }}
                axisLine={false} tickLine={false} tickFormatter={Mn.short} />
              <Tooltip contentStyle={ttS} labelStyle={tooltipLabel}
                itemStyle={tooltipItem} wrapperStyle={tooltipWrapper}
                cursor={tooltipCursor} formatter={(v,name) => [Mn.fmt(v),name]} />
              {Object.values(SECTIONS).map(s => (
                <Bar key={s.short} dataKey={s.short} stackId="a"
                  fill={s.color} radius={[3,3,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie: distribución por rubro */}
        <div style={{ background:'#111219',borderRadius:12,padding:'16px',
          border:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:10,fontWeight:700,color:'#475569',
            textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:12 }}>
            Distribución por rubro
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={rubroData} dataKey="total" nameKey="name"
                cx="50%" cy="50%" innerRadius={48} outerRadius={76}
                paddingAngle={2} stroke="none">
                {rubroData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={ttS} labelStyle={tooltipLabel}
                itemStyle={tooltipItem} wrapperStyle={tooltipWrapper}
                formatter={(v,name) => [Mn.fmt(v)+` (${Mn.pct(v,rubroTotal)})`,name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'4px 12px',
            justifyContent:'center',marginTop:8 }}>
            {rubroData.slice(0,10).map((r,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',
                gap:5,fontSize:10,color:'#94a3b8' }}>
                <div style={{ width:7,height:7,borderRadius:2,
                  background:COLORS[i%COLORS.length],flexShrink:0 }} />
                {r.name}
              </div>
            ))}
          </div>
        </div>

        {/* Line: Ingreso vs Gasto (full width) */}
        <div style={{ background:'#111219',borderRadius:12,padding:'16px',
          border:'1px solid rgba(255,255,255,0.08)',gridColumn:'1 / -1' }}>
          <div style={{ fontSize:10,fontWeight:700,color:'#475569',
            textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:12 }}>
            Ingreso vs Gasto · 12 meses
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={incomeVsExpenseData} margin={{ top:0,right:4,left:-14,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'#64748b',fontSize:10 }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b',fontSize:10 }}
                axisLine={false} tickLine={false} tickFormatter={Mn.short} />
              <Tooltip contentStyle={ttS} labelStyle={tooltipLabel}
                itemStyle={tooltipItem} wrapperStyle={tooltipWrapper}
                cursor={tooltipCursor} formatter={(v,name) => [Mn.fmt(v),name]} />
              <Line type="monotone" dataKey="Ingreso" stroke="#34d399" strokeWidth={2.5}
                dot={{ r:3, fill:'#34d399', strokeWidth:0 }}
                activeDot={{ r:5, fill:'#34d399' }} />
              <Line type="monotone" dataKey="Gasto" stroke="#f87171" strokeWidth={2.5}
                dot={{ r:3, fill:'#f87171', strokeWidth:0 }}
                activeDot={{ r:5, fill:'#f87171' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ height:28 }} />
    </div>
  );
}
