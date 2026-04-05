import { useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { MONTHS, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';

export function useDashboard() {
  const { transactions, income, budgets, monthlyBalance } = useStore();
  const mo = new Date().getMonth(); // 0-based, siempre el mes actual del calendario

  // ── Gastos (local, para charts y presupuestos) ─────────────────────────────
  const expenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

  // Gastos del mes actual — base para todos los cálculos del mes
  const currentMonthExpenses = useMemo(() => {
    const moStr = String(mo + 1).padStart(2, '0');
    return expenses.filter(tx => tx.transaction_date.slice(5, 7) === moStr);
  }, [expenses, mo]);

  // Totales por mes para gráficos (todos los gastos, manual + importado)
  const monthlyTotals = useMemo(() => {
    const t = new Array(12).fill(0);
    expenses.forEach(tx => { t[parseInt(tx.transaction_date.slice(5, 7)) - 1] += tx.amount_cents; });
    return t;
  }, [expenses]);

  // Gasto mensual por sección (tarjeta) — gráfico de barras del dashboard
  const sectionBarData = useMemo(() => {
    const subs = {};
    Object.keys(SECTIONS).forEach(k => { subs[k] = new Array(12).fill(0); });
    expenses.forEach(t => {
      const m = parseInt(t.transaction_date.slice(5, 7)) - 1;
      const sec = t.section || 'OTROS';
      if (subs[sec]) subs[sec][m] += t.amount_cents;
    });
    return MONTHS.map((name, i) => {
      const e = { name };
      Object.entries(SECTIONS).forEach(([k, v]) => { e[v.short] = subs[k]?.[i] || 0; });
      return e;
    });
  }, [expenses]);

  // Distribución por rubro del mes actual — gráfico de torta
  const rubroData = useMemo(() => {
    const m = {};
    currentMonthExpenses.forEach(tx => {
      const r = tx.categories?.name || 'Otros';
      m[r] = (m[r] || 0) + tx.amount_cents;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total }));
  }, [currentMonthExpenses]);

  // ── Balance (local, tiempo real) ───────────────────────────────────────────

  // Ingreso neto del mes (del store, ya cargado desde monthly_income)
  const ingresoNeto = income[mo] || 0;

  // Gastos del mes (todos los tipos, tiempo real desde estado local)
  const gastosDiarios = useMemo(() =>
    currentMonthExpenses.reduce((s, t) => s + t.amount_cents, 0),
    [currentMonthExpenses]
  );

  // Strings de fecha memoizados
  const { todayStr, weekStartStr } = useMemo(() => {
    const today = new Date();
    const ts = today.toISOString().split('T')[0];
    const ws = new Date(today);
    ws.setDate(today.getDate() - today.getDay());
    return { todayStr: ts, weekStartStr: ws.toISOString().split('T')[0] };
  }, [mo]);

  // Today's spending
  const todaySpent = useMemo(() =>
    currentMonthExpenses
      .filter(t => t.transaction_date.slice(0, 10) === todayStr)
      .reduce((s, t) => s + t.amount_cents, 0),
    [currentMonthExpenses, todayStr]
  );

  // This week's spending
  const weekSpent = useMemo(() =>
    currentMonthExpenses
      .filter(t => t.transaction_date.slice(0, 10) >= weekStartStr)
      .reduce((s, t) => s + t.amount_cents, 0),
    [currentMonthExpenses, weekStartStr]
  );

  // Restante = disponible actual − total gastado del mes
  const restante = ingresoNeto - gastosDiarios;

  // ── Alertas ────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const al = [];

    // Alertas de balance
    if (restante < 0) {
      al.push({ t: 'danger', m: `Déficit de ${Mn.fmt(Math.abs(restante))} en ${MONTHS[mo]}` });
    } else if (ingresoNeto > 0 && gastosDiarios > ingresoNeto * 0.8) {
      al.push({ t: 'warning', m: `Gastaste el ${Mn.pct(gastosDiarios, ingresoNeto)} del ingreso de ${MONTHS[mo]}` });
    }

    if (ingresoNeto > 0 && restante > 0) {
      al.push({ t: 'info', m: `Podés destinar ${Mn.fmt(restante)} a ahorro o inversión` });
    }

    // Alertas de presupuesto por rubro
    if (budgets && Object.keys(budgets).length) {
      const rm = {};
      currentMonthExpenses.forEach(t => { const r = t.categories?.name || 'Otros'; rm[r] = (rm[r] || 0) + t.amount_cents; });
      Object.entries(budgets).forEach(([rubro, limit]) => {
        const spent = rm[rubro] || 0;
        if (limit > 0 && spent > limit) {
          al.push({ t: 'danger', m: `${RUBRO_EMOJI[rubro] || '📎'} ${rubro}: ${Mn.fmt(spent)} de ${Mn.fmt(limit)}` });
        } else if (limit > 0 && spent > limit * 0.8) {
          al.push({ t: 'warning', m: `${RUBRO_EMOJI[rubro] || '📎'} ${rubro}: ${Mn.pct(spent, limit)} del presupuesto` });
        }
      });
    }

    return al;
  }, [currentMonthExpenses, budgets, ingresoNeto, gastosDiarios, restante, mo]);

  // ── Presupuestos ───────────────────────────────────────────────────────────
  const budgetEntries = useMemo(() => {
    if (!budgets || !Object.keys(budgets).length) return [];
    const rm = {};
    currentMonthExpenses.forEach(t => { const r = t.categories?.name || 'Otros'; rm[r] = (rm[r] || 0) + t.amount_cents; });
    return Object.entries(budgets).filter(([, v]) => v > 0).map(([rubro, limit]) => {
      const spent = rm[rubro] || 0;
      return { rubro, limit, spent, pct: Math.min((spent / limit) * 100, 150) };
    }).sort((a, b) => b.pct - a.pct);
  }, [currentMonthExpenses, budgets]);

  // ── Gráfico Ingreso vs Gasto ───────────────────────────────────────────────
  const incomeVsExpenseData = useMemo(() =>
    MONTHS.map((m, i) => ({
      name: m,
      Ingreso: income[i] || 0,
      Gasto: monthlyTotals[i] || 0,
    })),
    [income, monthlyTotals]
  );

  // ── Cards del dashboard ────────────────────────────────────────────────────
  const cards = useMemo(() => [
    {
      l: `Disponible ${MONTHS[mo]}`,
      v: ingresoNeto > 0 ? Mn.short(ingresoNeto) : '—',
      f: Mn.fmt(ingresoNeto),
      c: '#2dd4a8',
      s: 'Neto mensual',
    },
    {
      l: 'Restante',
      v: Mn.short(restante),
      f: Mn.fmt(restante),
      c: restante >= 0 ? '#2dd4a8' : '#f06070',
      s: gastosDiarios > 0 ? `− ${Mn.short(gastosDiarios)} gastado` : 'Sin gastos este mes',
    },
  ], [mo, ingresoNeto, restante, gastosDiarios]);

  const rubroTotal = rubroData.reduce((s, r) => s + r.total, 0);

  return {
    mo,
    sectionBarData,
    monthlyTotals,
    rubroData,
    rubroTotal,
    alerts,
    budgetEntries,
    ingresoNeto,
    restante,
    incomeVsExpenseData,
    cards,
    todaySpent,
    weekSpent,
  };
}
