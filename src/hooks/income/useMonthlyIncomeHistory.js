import { useState, useEffect, useCallback } from 'react';
import { monthlyIncomeService } from '@/services/monthlyIncome.service';
import { useAuth } from '@/hooks/auth/useAuth';

export function useMonthlyIncomeHistory() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await monthlyIncomeService.getMonthlyIncomeHistory(userId);
        if (!cancelled) setRows(data ?? []);
      } catch (err) {
        if (!cancelled) { setError(err); setRows([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const updateRow = useCallback((month, amount) => {
    setRows(prev => {
      const exists = prev.some(r => r.month === month);
      if (exists) return prev.map(r => r.month === month ? { ...r, amount } : r);
      return [...prev, { month, amount }].sort((a, b) => a.month.localeCompare(b.month));
    });
  }, []);

  const deleteRow = useCallback((month) => {
    setRows(prev => prev.filter(r => r.month !== month));
  }, []);

  return { rows, loading, error, updateRow, deleteRow };
}
