import { useState } from 'react';
import { SECTIONS, COLORS, MONTHS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { cardStyle, tooltipStyle, tooltipLabel, tooltipItem, tooltipWrapper, tooltipCursor } from '@/utils/styles';
import { useDashboard } from '@/hooks/analytics/useDashboard';
import { useMonthComparison } from '@/hooks/analytics/useMonthComparison';
import { useMonthlyIncome } from '@/hooks/income/useMonthlyIncome';
import { useSavingsGoals } from '@/hooks/savings/useSavingsGoals';
import { MonthlyIncomeHistory } from '@/components/income/MonthlyIncomeHistory';
import { Pnl } from '@/components/ui/Shared';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export function DashPage() {
  const {
    mo, sectionBarData, rubroData, rubroTotal,
    alerts, budgetEntries, incomeVsExpenseData, cards,
    todaySpent, weekSpent, dailyAvg,
  } = useDashboard();
  const { goals } = useSavingsGoals();
  const { data: cmp, loading: cmpLoading } = useMonthComparison();
  const ttS = tooltipStyle;

  // Monthly income editor
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { income: incomeValue, loading: incLoading, updateIncome } = useMonthlyIncome(monthKey);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal,  setInputVal]  = useState('');

  const fmtMoney = n => {
    const safe = isFinite(n) && !isNaN(n) ? Math.max(0, n) : 0;
    return '$' + safe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const varColor = v => v > 0 ? '#2dd4a8' : v < 0 ? '#f06070' : '#6c7280';
  const varLabel = v => v === 0 ? '—' : (v > 0 ? '+' : '') + v + '%';

  function DashCard({ card: c }) {
    const [exp, setExp] = useState(false);
    return (
      <div style={cardStyle} onClick={() => setExp(!exp)} title={c.f}>
        <div style={{ fontSize:10,color:'#6c7280',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px' }}>{c.l}</div>
        <div style={{ fontSize:exp?13:26,fontWeight:800,color:c.c,letterSpacing:'-0.5px',margin:'4px 0 2px',cursor:'pointer',transition:'font-size .15s',fontVariantNumeric:'tabular-nums' }}>{exp?c.f:c.v}</div>
        <div style={{ fontSize:10,color:'#6c7280' }}>{c.s}</div>
      </div>
    );
  }

  return (
    <div style={{ padding:'0 16px',maxWidth:1000,margin:'0 auto' }}>
      <style>{`
        .dash-cards { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
        .dash-charts { display:flex; flex-direction:column; gap:14px; }
        @media (min-width:768px) {
          .dash-cards { grid-template-columns:repeat(4,1fr); }
          .dash-charts { display:grid; grid-template-columns:1fr 1fr; }
        }
      `}</style>

      {/* Summary cards */}
      <div className="dash-cards">
        {cards.map((c,i) => <DashCard key={i} card={c} />)}
      </div>

      {/* Quick summary chips */}
      <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap' }}>
        {[
          { l:'Hoy', v: Mn.fmt(todaySpent), c:'#6c7280' },
          { l:'Esta semana', v: Mn.fmt(weekSpent), c:'#6c7280' },
          { l:'Promedio diario', v: Mn.fmt(dailyAvg), c:'#6c7280' },
        ].map(chip => (
          <div key={chip.l} style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'7px 12px',display:'flex',flexDirection:'column',gap:2 }}>
            <span style={{ fontSize:9,fontWeight:600,color:'#6c7280',textTransform:'uppercase',letterSpacing:'0.5px' }}>{chip.l}</span>
            <span style={{ fontSize:14,fontWeight:700,color:'#e8e8f0',fontVariantNumeric:'tabular-nums' }}>{chip.v}</span>
          </div>
        ))}
      </div>

      {/* Monthly income editor */}
      <Pnl title={`Ingreso ${MONTHS[mo]}`}>
        {incLoading && !isEditing ? (
          <div className="flex items-center justify-between">
            <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-8 w-9 rounded-lg bg-white/[0.03] animate-pulse" />
          </div>
        ) : isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              min="0"
              step="1"
              placeholder="0"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-lg font-bold text-[#e8e8f0] outline-none focus:border-[#7c6cf0] transition-colors"
            />
            <button
              onClick={handleSave}
              disabled={incLoading}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-[#22c55e] text-[#0a0a12] disabled:opacity-50 cursor-pointer transition-opacity"
            >
              {incLoading ? '…' : '✓'}
            </button>
            <button
              onClick={cancelEdit}
              className="px-3 py-2 rounded-lg text-sm bg-white/5 text-[#6c7280] cursor-pointer hover:text-[#e8e8f0] transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span style={{ fontSize:30,fontWeight:800,color:'#2dd4a8',letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums' }}>
              {fmtMoney(incomeValue)}
            </span>
            <button
              onClick={startEdit}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-[#6c7280] text-sm cursor-pointer hover:text-[#e8e8f0] transition-colors"
              title="Editar ingreso mensual"
            >
              ✏️
            </button>
          </div>
        )}
      </Pnl>

      {/* Monthly net income history */}
      <MonthlyIncomeHistory />

      {/* Month comparison */}
      <Pnl title={`Comparación vs ${MONTHS[mo === 0 ? 11 : mo - 1]}`}>
        <style>{`.cmp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}`}</style>
        <div className="cmp-grid">
          {[
            { label: 'Ingresos',  key: 'income'   },
            { label: 'Gastos',    key: 'expenses' },
            { label: 'Balance',   key: 'balance'  },
          ].map(({ label, key }) => {
            const val = cmp?.current?.[key]  ?? 0;
            const vrn = cmp?.variation?.[key] ?? 0;
            return (
              <div key={key} style={{ background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'10px 12px' }}>
                <div style={{ fontSize:10,color:'#6c7280',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4 }}>
                  {label}
                </div>
                {cmpLoading ? (
                  <div style={{ height:20,borderRadius:6,background:'rgba(255,255,255,0.06)',marginBottom:4 }} />
                ) : (
                  <div style={{ fontSize:15,fontWeight:800,color:'#e8e8f0',marginBottom:2 }}>
                    {Mn.fmt(val)}
                  </div>
                )}
                {cmpLoading ? (
                  <div style={{ height:12,width:'50%',borderRadius:4,background:'rgba(255,255,255,0.04)' }} />
                ) : (
                  <div style={{ fontSize:11,fontWeight:600,color:varColor(vrn) }}>
                    {varLabel(vrn)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Pnl>

      {/* Alerts */}
      {alerts.map((a,i) => (
        <div key={i} style={{ padding:'8px 12px',borderRadius:10,fontSize:12,fontWeight:500,marginBottom:6,background:a.t==='danger'?'rgba(240,96,112,0.12)':a.t==='warning'?'rgba(240,168,72,0.12)':'rgba(124,108,240,0.1)',color:a.t==='danger'?'#f06070':a.t==='warning'?'#f0a848':'#a8a0f8',border:`1px solid ${a.t==='danger'?'rgba(240,96,112,0.2)':a.t==='warning'?'rgba(240,168,72,0.2)':'rgba(124,108,240,0.15)'}` }}>
          {a.t==='danger'?'🚨':a.t==='warning'?'⚠️':'💡'} {a.m}
        </div>
      ))}


      {/* Budget progress */}
      {budgetEntries.length > 0 && (
        <Pnl title={`Presupuestos ${MONTHS[mo]}`}>
          {budgetEntries.map((b,i) => (
            <div key={i} style={{ marginBottom:i<budgetEntries.length-1?12:0 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                <span style={{ fontSize:11,fontWeight:600,color:'#e8e8f0' }}>{RUBRO_EMOJI[b.rubro]||'📎'} {b.rubro}</span>
                <span style={{ fontSize:10,color:b.pct>100?'#f06070':b.pct>80?'#f0a848':'#6c7280' }}>{Mn.fmt(b.spent)} / {Mn.fmt(b.limit)}</span>
              </div>
              <div style={{ height:6,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                <div style={{ height:'100%',borderRadius:3,width:`${Math.min(b.pct,100)}%`,background:b.pct>100?'#f06070':b.pct>80?'#f0a848':'#2dd4a8',transition:'width .5s' }} />
              </div>
            </div>
          ))}
        </Pnl>
      )}

      {/* Savings goals */}
      {goals.length > 0 && (
        <Pnl title="Metas de ahorro">
          {goals.map(g => {
            const pct = g.target_amount > 0 ? Math.min((g.saved_amount / g.target_amount) * 100, 100) : 0;
            return (
              <div key={g.id} style={{ marginBottom: goals.indexOf(g) < goals.length-1 ? 16 : 0 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                  <span style={{ fontSize:15,fontWeight:700,color:'#e8e8f0' }}>🎯 {g.name}</span>
                  <span style={{ fontSize:13,fontWeight:600,color: pct >= 100 ? '#4ade80' : '#6c7280',fontVariantNumeric:'tabular-nums' }}>{Mn.fmt(g.saved_amount)} / {Mn.fmt(g.target_amount)}</span>
                </div>
                <div style={{ height:7,borderRadius:4,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                  <div style={{ height:'100%',borderRadius:4,width:`${pct}%`,background: pct >= 100 ? '#4ade80' : '#7c6cf0',transition:'width .5s' }} />
                </div>
                {g.deadline && <div style={{ fontSize:11,color:'#6c7280',marginTop:4 }}>Meta: {g.deadline}</div>}
              </div>
            );
          })}
        </Pnl>
      )}

      {/* Charts - 2 columns on desktop */}
      <div className="dash-charts">
        <Pnl title="Gasto mensual por tarjeta">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectionBarData} margin={{ top:0,right:0,left:-10,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill:'#8888a0',fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#8888a0',fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={Mn.short} />
              <Tooltip contentStyle={ttS} labelStyle={tooltipLabel} itemStyle={tooltipItem} wrapperStyle={tooltipWrapper} cursor={tooltipCursor} formatter={(v,name) => [Mn.fmt(v),name]} />
              {Object.values(SECTIONS).map(s => <Bar key={s.short} dataKey={s.short} stackId="a" fill={s.color} radius={[2,2,0,0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </Pnl>

        <Pnl title="Distribución por rubro">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={rubroData} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                {rubroData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={ttS} labelStyle={tooltipLabel} itemStyle={tooltipItem} wrapperStyle={tooltipWrapper} formatter={(v,name) => [Mn.fmt(v)+` (${Mn.pct(v,rubroTotal)})`,name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'4px 12px',justifyContent:'center',marginTop:6 }}>
            {rubroData.slice(0,10).map((r,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#a0a0b8' }}>
                <div style={{ width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length] }} />{r.name}
              </div>
            ))}
          </div>
        </Pnl>

        <div style={{ gridColumn:'1 / -1' }}>
          <Pnl title="Ingreso vs gasto">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incomeVsExpenseData} margin={{ top:0,right:0,left:-10,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill:'#8888a0',fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#8888a0',fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={Mn.short} />
                <Tooltip contentStyle={ttS} labelStyle={tooltipLabel} itemStyle={tooltipItem} wrapperStyle={tooltipWrapper} cursor={tooltipCursor} formatter={(v,name) => [Mn.fmt(v),name]} />
                <Line type="monotone" dataKey="Ingreso" stroke="#2dd4a8" strokeWidth={2} dot={{ r:3,fill:'#2dd4a8' }} />
                <Line type="monotone" dataKey="Gasto" stroke="#f06070" strokeWidth={2} dot={{ r:3,fill:'#f06070' }} />
              </LineChart>
            </ResponsiveContainer>
          </Pnl>
        </div>
      </div>
      <div style={{ height:24 }} />
    </div>
  );
}
