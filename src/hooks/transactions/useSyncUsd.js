import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { transactionsService } from '@/services/transactions.service';
import { dolarService } from '@/services/dolar.service';

export function useSyncUsd() {
  const { transactions, loadAll } = useStore();
  const [loading, setLoading] = useState(false);

  const sync = async () => {
    setLoading(true);
    try {
      const rate = await dolarService.getMepRate();
      if (!rate) throw new Error('Error cotización');

      const currentMonth = new Date().getMonth();
      const usdTxs = transactions.filter(t =>
        t.usd_amount != null &&
        new Date(t.transaction_date).getMonth() === currentMonth
      );

      await Promise.all(
        usdTxs.map(tx =>
          transactionsService.updateUsdRate(tx.id, Math.round(tx.usd_amount * rate), rate)
        )
      );

      await loadAll();
      return { count: usdTxs.length, rate };
    } finally {
      setLoading(false);
    }
  };

  return { sync, loading };
}
