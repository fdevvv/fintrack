import { useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { MONTHS, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';

export function useDashboard() {
  const { transactions, income, budgets } = useStore();
  const mo = new Date().getMonth();

  const expenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

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
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total }));
  }, [expenses]);

  const alerts = useMemo(() => {
    const al = [];
    const g = monthlyTotals[mo] || 0, ing = income[mo] || 0;
    if (ing > 0 && g > ing) al.push({ t: 'danger', m: `Superaste tu ingreso de ${MONTHS[mo]} por ${Mn.fmt(g - ing)}` });
    else if (ing > 0 && g > ing * 0.8) al.push({ t: 'warning', m: `Vas ${Mn.pct(g, ing)} del ingreso de ${MONTHS[mo]}` });
    if (ing > 0 && g > 0 && ing - g > 0) al.push({ t: 'info', m: `Podés destinar ${Mn.fmt(ing - g)} a ahorro o inversión` });
    if (budgets && Object.keys(budgets).length) {
      const rm = {};
      expenses.filter(t => new Date(t.transaction_date).getMonth() === mo)
        .forEach(t => { const r = t.categories?.name || 'Otros'; rm[r] = (rm[r] || 0) + t.amount_cents; });
      Object.entries(budgets).forEach(([rubro, limit]) => {
        const spent = rm[rubro] || 0;
        if (limit > 0 && spent > limit) al.push({ t: 'danger', m: `${RUBRO_EMOJI[rubro] || '📎'} ${rubro}: ${Mn.fmt(spent)} de ${Mn.fmt(limit)}` });
        else if (limit > 0 && spent > limit * 0.8) al.push({ t: 'warning', m: `${RUBRO_EMOJI[rubro] || '📎'} ${rubro}: ${Mn.pct(spent, limit)} del presupuesto` });
      });
    }
    return al;
  }, [monthlyTotals, income, budgets, expenses, mo]);

  const budgetEntries = useMemo(() => {
    if (!budgets || !Object.keys(budgets).length) return [];
    const rm = {};
    expenses.filter(t => new Date(t.transaction_date).getMonth() === mo)
      .forEach(t => { const r = t.categories?.name || 'Otros'; rm[r] = (rm[r] || 0) + t.amount_cents; });
    return Object.entries(budgets).filter(([, v]) => v > 0).map(([rubro, limit]) => {
      const spent = rm[rubro] || 0;
      return { rubro, limit, spent, pct: Math.min((spent / limit) * 100, 150) };
    }).sort((a, b) => b.pct - a.pct);
  }, [expenses, budgets, mo]);

  const totalExp = monthlyTotals[mo] || 0;
  const ing = income[mo] || 0;
  const rest = ing - totalExp;
  const pct = ing > 0 ? ((totalExp / ing) * 100).toFixed(1) : 0;
  const anual = monthlyTotals.reduce((a, b) => a + b, 0);
  const rubroTotal = rubroData.reduce((s, r) => s + r.total, 0);

  const incomeVsExpenseData = MONTHS.map((m, i) => ({
    name: m,
    Ingreso: income[i] || 0,
    Gasto: monthlyTotals[i] || 0,
  }));

  const cards = [
    { l: `Ingreso ${MONTHS[mo]}`, v: ing > 0 ? Mn.short(ing) : '—', f: Mn.fmt(ing), c: '#2dd4a8', s: 'Neto mensual' },
    { l: `Gasto ${MONTHS[mo]}`, v: Mn.short(totalExp), f: Mn.fmt(totalExp), c: '#f06070', s: `${pct}% del ingreso` },
    { l: 'Restante', v: Mn.short(rest), f: Mn.fmt(rest), c: rest >= 0 ? '#2dd4a8' : '#f06070', s: rest >= 0 ? 'Disponible' : '⚠️ Déficit' },
    { l: 'Total Anual', v: Mn.short(anual), f: Mn.fmt(anual), c: '#7c6cf0', s: 'Acumulado' },
  ];

  return {
    mo,
    sectionBarData,
    monthlyTotals,
    rubroData,
    rubroTotal,
    alerts,
    budgetEntries,
    totalExp,
    ing,
    rest,
    pct,
    anual,
    incomeVsExpenseData,
    cards,
  };
}
