import { useMemo } from 'react';
import { useStore } from '@/stores/useStore';

export function useTransactions({ month, search, filterRub, filterSec, filterMethod, sourceFilter } = {}) {
  const { transactions } = useStore();

  const expenses = useMemo(() =>
    transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (sourceFilter && t.source !== sourceFilter) return false;
      return true;
    }),
    [transactions, sourceFilter]
  );

  const filtered = useMemo(() => {
    let f = expenses;
    if (month >= 0) f = f.filter(t => new Date(t.transaction_date).getMonth() === month);
    if (search?.trim()) {
      const s = search.toUpperCase();
      f = f.filter(t => (t.item_name || t.description || '').toUpperCase().includes(s));
    }
    if (filterRub) f = f.filter(t => (t.categories?.name || 'Otros') === filterRub);
    if (filterSec) f = f.filter(t => (t.section || 'OTROS') === filterSec);
    if (filterMethod) f = f.filter(t => t.payment_method === filterMethod);
    return f;
  }, [expenses, month, search, filterRub, filterSec, filterMethod]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const key = `${(t.item_name || '').toUpperCase()}||${t.section || 'OTROS'}`;
      if (!map[key]) map[key] = { ...t, items: [], totalAmount: 0, maxInstallmentTotal: t.installment_total || 1 };
      map[key].items.push(t);
      map[key].totalAmount += t.amount_cents;
      if ((t.installment_total || 1) > map[key].maxInstallmentTotal) {
        map[key].maxInstallmentTotal = t.installment_total;
      }
    });
    return Object.values(map).sort((a, b) => {
      const ra = a.categories?.name || 'Otros';
      const rb = b.categories?.name || 'Otros';
      return ra === rb ? b.totalAmount - a.totalAmount : ra.localeCompare(rb);
    });
  }, [filtered]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.amount_cents, 0), [filtered]);

  const rubrosInData = useMemo(() =>
    [...new Set(expenses.map(t => t.categories?.name || 'Otros'))].sort(),
    [expenses]
  );

  const secsInData = useMemo(() =>
    [...new Set(expenses.map(t => t.section || 'OTROS'))],
    [expenses]
  );

  const catBreakdown = useMemo(() => {
    const m = {};
    filtered.forEach(t => {
      const r = t.categories?.name || 'Otros';
      m[r] = (m[r] || 0) + t.amount_cents;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, total: value }));
  }, [filtered]);

  const monthComparison = useMemo(() => {
    const mo = month >= 0 ? month : new Date().getMonth();
    const prev = mo === 0 ? 11 : mo - 1;
    const curMonth = {}, prevMonth = {};
    expenses.forEach(t => {
      const m = new Date(t.transaction_date).getMonth();
      const cat = t.categories?.name || 'Otros';
      if (m === mo) curMonth[cat] = (curMonth[cat] || 0) + t.amount_cents;
      if (m === prev) prevMonth[cat] = (prevMonth[cat] || 0) + t.amount_cents;
    });
    const allCats = [...new Set([...Object.keys(curMonth), ...Object.keys(prevMonth)])];
    return {
      currentMonthIdx: mo,
      prevMonthIdx: prev,
      data: allCats
        .map(cat => ({ name: cat, current: curMonth[cat] || 0, previous: prevMonth[cat] || 0 }))
        .sort((a, b) => b.current - a.current),
    };
  }, [expenses, month]);

  return { filtered, grouped, total, rubrosInData, secsInData, catBreakdown, monthComparison };
}
