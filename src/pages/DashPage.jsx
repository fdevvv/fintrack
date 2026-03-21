import { useMemo, useState } from 'react';
import { useStore } from '@/stores/useStore';
import { MONTHS, SECTIONS, COLORS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';
import { cardStyle, tooltipStyle, tooltipLabel, tooltipItem, tooltipWrapper, tooltipCursor } from '@/utils/styles';
import { Pnl } from '@/components/ui/Shared';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export function DashPage() {
  const { transactions, income, budgets } = useStore();
  const mo = new Date().getMonth();
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense'), [transactions]);

  const sectionBarData = useMemo(() => {
    const subs = {};
    Object.keys(SECTIONS).forEach(k => { subs[k] = new Array(12).fill(0); });
    expenses.forEach(t => {
      const m = new Date(t.transaction_date).getMonth();
      const sec = t.section || 'OTROS';
      if (subs[sec]) subs[sec][m] += t.amount_cents;
    });
    return MONTHS.map((name, i) => {
      const e = { name };
      Object.entries(SECTIONS).forEach(([k, v]) => { e[v.short] = subs[k]?.[i] || 0; });
      return e;
    });
  }, [expenses]);

  const monthlyTotals = useMemo(() => {
    const t = new Array(12).fill(0);
    expenses.forEach(tx => { t[new Date(tx.transaction_date).getMonth()] += tx.amount_cents; });
    return t;
  }, [expenses]);

  const rubroData = useMemo(() => {
    const m = {};
    expenses.forEach(tx => { const r = tx.categories?.name || 'Otros'; m[r] = (m[r] || 0) + tx.amount_cents; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([name,total]) => ({ name, total }));
  }, [expenses]);

  const alerts = useMemo(() => {
    const al = [];
    const g = monthlyTotals[mo] || 0, ing = income[mo] || 0;
    if (ing > 0 && g > ing) al.push({ t:'danger', m:`Superaste tu ingreso de ${MONTHS[mo]} por ${Mn.fmt(g-ing)}` });
    else if (ing > 0 && g > ing*0.8) al.push({ t:'warning', m:`Vas ${Mn.pct(g,ing)} del ingreso de ${MONTHS[mo]}` });
    if (ing > 0 && g > 0 && ing-g > 0) al.push({ t:'info', m:`Podés destinar ${Mn.fmt(ing-g)} a ahorro o inversión` });
    if (budgets && Object.keys(budgets).length) {
      const rm = {};
      expenses.filter(t => new Date(t.transaction_date).getMonth() === mo).forEach(t => { const r = t.categories?.name||'Otros'; rm[r]=(rm[r]||0)+t.amount_cents; });
      Object.entries(budgets).forEach(([rubro, limit]) => {
        const spent = rm[rubro]||0;
        if (limit>0 && spent>limit) al.push({ t:'danger', m:`${RUBRO_EMOJI[rubro]||'📎'} ${rubro}: ${Mn.fmt(spent)} de ${Mn.fmt(limit)}` });
        else if (limit>0 && spent>limit*0.8) al.push({ t:'warning', m:`${RUBRO_EMOJI[rubro]||'📎'} ${rubro}: ${Mn.pct(spent,limit)} del presupuesto` });
      });
    }
    return al;
  }, [monthlyTotals, income, budgets, expenses, mo]);

  const budgetEntries = useMemo(() => {
    if (!budgets || !Object.keys(budgets).length) return [];
    const rm = {};
    expenses.filter(t => new Date(t.transaction_date).getMonth()===mo).forEach(t => { const r=t.categories?.name||'Otros'; rm[r]=(rm[r]||0)+t.amount_cents; });
    return Object.entries(budgets).filter(([,v])=>v>0).map(([rubro,limit]) => {
      const spent=rm[rubro]||0; return { rubro,limit,spent,pct:Math.min((spent/limit)*100,150) };
    }).sort((a,b)=>b.pct-a.pct);
  }, [expenses, budgets, mo]);

  const totalExp = monthlyTotals[mo]||0, ing = income[mo]||0, rest = ing-totalExp;
  const pct = ing>0?((totalExp/ing)*100).toFixed(1):0;
  const anual = monthlyTotals.reduce((a,b)=>a+b,0);
  const total = rubroData.reduce((s,r)=>s+r.total,0);
  const ttS = tooltipStyle;

  const cards = [
    { l:`Ingreso ${MONTHS[mo]}`, v:ing>0?Mn.short(ing):'—', f:Mn.fmt(ing), c:'#2dd4a8', s:'Neto mensual' },
    { l:`Gasto ${MONTHS[mo]}`, v:Mn.short(totalExp), f:Mn.fmt(totalExp), c:'#f06070', s:`${pct}% del ingreso` },
    { l:'Restante', v:Mn.short(rest), f:Mn.fmt(rest), c:rest>=0?'#2dd4a8':'#f06070', s:rest>=0?'Disponible':'⚠️ Déficit' },
    { l:'Total Anual', v:Mn.short(anual), f:Mn.fmt(anual), c:'#7c6cf0', s:'Acumulado' },
  ];

  function DashCard({ card: c }) {
    const [exp, setExp] = useState(false);
    return (
      <div style={cardStyle} onClick={() => setExp(!exp)} title={c.f}>
        <div style={{ fontSize:10,color:'#6c6c84',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px' }}>{c.l}</div>
        <div style={{ fontSize:exp?14:20,fontWeight:800,color:c.c,letterSpacing:'-0.5px',margin:'4px 0 2px',cursor:'pointer',transition:'font-size .15s' }}>{exp?c.f:c.v}</div>
        <div style={{ fontSize:10,color:'#5c5c72' }}>{c.s}</div>
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
                <span style={{ fontSize:10,color:b.pct>100?'#f06070':b.pct>80?'#f0a848':'#5c5c72' }}>{Mn.fmt(b.spent)} / {Mn.fmt(b.limit)}</span>
              </div>
              <div style={{ height:6,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                <div style={{ height:'100%',borderRadius:3,width:`${Math.min(b.pct,100)}%`,background:b.pct>100?'#f06070':b.pct>80?'#f0a848':'#2dd4a8',transition:'width .5s' }} />
              </div>
            </div>
          ))}
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
              <Tooltip contentStyle={ttS} labelStyle={tooltipLabel} itemStyle={tooltipItem} wrapperStyle={tooltipWrapper} formatter={(v,name) => [Mn.fmt(v)+` (${Mn.pct(v,total)})`,name]} />
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
              <LineChart data={MONTHS.map((m,i) => ({ name:m,Ingreso:income[i]||0,Gasto:monthlyTotals[i]||0 }))} margin={{ top:0,right:0,left:-10,bottom:0 }}>
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
