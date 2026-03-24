import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { transactionsService } from '@/services/transactions.service';
import { dolarService } from '@/services/dolar.service';

export function useAddTransaction() {
  const { year, appendTransactions } = useStore();
  const [loading, setLoading] = useState(false);

  const add = async ({
    item_name,
    category_id,
    section,
    amount,
    cuotas = 1,
    start_month,
    currency = 'ARS',
    payment_method = 'cash',
    destino = 'manual',
    usd_amount: preUsdAmount = null,
    usd_rate: preUsdRate = null,
  }) => {
    setLoading(true);
    try {
      let finalMonto = Math.round(Number(amount));
      let usdAmount = preUsdAmount;
      let usdRate = preUsdRate;

      if (currency === 'USD') {
        const rate = await dolarService.getMepRate();
        if (!rate) throw new Error('Error cotización');
        usdAmount = Number(amount);
        usdRate = rate;
        finalMonto = Math.round(usdAmount * rate);
      }

      const isManual = destino === 'manual';
      const installment_total = isManual ? 1 : (Number(cuotas) || 1);
      const groupId = crypto.randomUUID();

      const rows = [];
      for (let i = 0; i < installment_total; i++) {
        const monthIdx = (start_month - 1) + i;
        if (monthIdx < 0) continue;
        if (monthIdx >= 12) break;
        const txDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-15`;
        rows.push({
          category_id,
          amount_cents: finalMonto,
          currency: 'ARS',
          type: 'expense',
          payment_method: isManual ? payment_method : 'credit_card',
          section: isManual ? 'OTROS' : section,
          description: item_name.toUpperCase(),
          item_name: item_name.toUpperCase(),
          transaction_date: txDate,
          year,
          installment_current: i + 1,
          installment_total,
          installment_group_id: groupId,
          usd_amount: usdAmount,
          usd_rate: usdRate,
          source: isManual ? 'manual' : 'imported',
        });
      }

      const data = await transactionsService.insertMany(rows);
      appendTransactions(data);
      return { data, usdAmount, usdRate, finalMonto };
    } finally {
      setLoading(false);
    }
  };

  return { add, loading };
}
