import { useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { SECTIONS } from '@/utils/constants';

export function useMonthDetail(monthKey) {
  const { transactions, income } = useStore();

  const { year, monthIndex } = useMemo(() => {
    if (!monthKey) return { year: -1, monthIndex: -1 };
    const [y, m] = monthKey.split('-').map(Number);
    return { year: y, monthIndex: m - 1 };
  }, [monthKey]);

  const expenses = useMemo(() =>
    transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.transaction_date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    }),
    [transactions, year, monthIndex]
  );

  const totalExpenses = useMemo(() =>
    expenses.reduce((s, t) => s + t.amount_cents, 0),
    [expenses]
  );

  const ingresoNeto = monthIndex >= 0 ? (income[monthIndex] || 0) : 0;
  const disponible  = ingresoNeto - totalExpenses;

  const rubroData = useMemo(() => {
    const m = {};
    expenses.forEach(tx => {
      const r = tx.categories?.name || 'Otros';
      m[r] = (m[r] || 0) + tx.amount_cents;
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name, total }));
  }, [expenses]);

  const sectionData = useMemo(() => {
    const m = {};
    expenses.forEach(tx => {
      const s = tx.section || 'OTROS';
      m[s] = (m[s] || 0) + tx.amount_cents;
    });
    return Object.entries(SECTIONS)
      .map(([key, def]) => ({ key, label: def.short, color: def.color, total: m[key] || 0 }))
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  return { ingresoNeto, totalExpenses, disponible, rubroData, sectionData, expenses };
}
