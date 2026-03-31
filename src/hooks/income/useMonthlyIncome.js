import { useState, useEffect, useCallback } from 'react';
import { monthlyIncomeService } from '@/services/monthlyIncome.service';
import { useAuth } from '@/hooks/auth/useAuth';

export function useMonthlyIncome(month) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [income,  setIncome]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId || !month) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const value = await monthlyIncomeService.getMonthlyIncome(userId, month);
        if (!cancelled) setIncome(value ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setIncome(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, month]);

  // ── Update ───────────────────────────────────────────────────────────────

  const updateIncome = useCallback(async (amount) => {
    if (!userId || !month) return;

    setLoading(true);
    setError(null);

    try {
      const saved = await monthlyIncomeService.upsertMonthlyIncome(userId, month, amount);
      setIncome(saved ?? 0);
    } catch (err) {
      setError(err);
      setIncome(0);
    } finally {
      setLoading(false);
    }
  }, [userId, month]);

  return { income, loading, error, updateIncome };
}
