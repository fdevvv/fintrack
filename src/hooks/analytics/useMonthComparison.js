import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { useAuth } from '@/hooks/auth/useAuth';

const EMPTY_DATA = {
  current:  { income: 0, expenses: 0, balance: 0 },
  previous: { income: 0, expenses: 0, balance: 0 },
  variation: { income: 0, expenses: 0, balance: 0 },
};

/** Ejecuta fn hasta maxAttempts veces. Lanza el último error si todas fallan. */
async function fetchWithRetry(fn, maxAttempts = 2) {
  let lastErr;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export function useMonthComparison() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [data, setData]       = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchWithRetry(
          () => analyticsService.getMonthComparison(userId)
        );
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setData(EMPTY_DATA);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}
