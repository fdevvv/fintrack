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

      const amountPerInstallment = Math.round(finalMonto / installment_total);
      const rows = [];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      for (let i = 0; i < installment_total; i++) {
        const monthIdx = (start_month - 1) + i;
        if (monthIdx < 0) continue;
        const txYear = monthIdx >= 12 ? year + 1 : year;
        const txMonth = (monthIdx % 12) + 1;
        // Manuales: fecha real de hoy. Tarjeta/cuotas: día 15 del mes correspondiente.
        const txDate = isManual ? todayStr : `${txYear}-${String(txMonth).padStart(2,'0')}-15`;
        rows.push({
          category_id,
          amount_cents: amountPerInstallment,
          currency: 'ARS',
          type: 'expense',
          payment_method: isManual ? payment_method : 'credit_card',
          section: isManual ? 'OTROS' : section,
          description: item_name.toUpperCase(),
          item_name: item_name.toUpperCase(),
          transaction_date: txDate,
          year: txYear,
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

  // Inserta múltiples gastos importados en una sola request a Supabase.
  // Todos los montos ya deben venir en ARS (conversión USD hecha antes).
  const addBatch = async (items) => {
    setLoading(true);
    try {
      const allRows = [];
      for (const { item_name, category_id, section, amount, cuotas = 1, start_month, usd_amount = null, usd_rate = null } of items) {
        const installment_total = Number(cuotas) || 1;
        const groupId = crypto.randomUUID();
        const amountPerInstallment = Math.round(Number(amount) / installment_total);
        for (let i = 0; i < installment_total; i++) {
          const monthIdx = (start_month - 1) + i;
          if (monthIdx < 0) continue;
          const txYear = monthIdx >= 12 ? year + 1 : year;
          const txMonth = (monthIdx % 12) + 1;
          allRows.push({
            category_id,
            amount_cents: amountPerInstallment,
            currency: 'ARS',
            type: 'expense',
            payment_method: 'credit_card',
            section,
            description: item_name.toUpperCase(),
            item_name: item_name.toUpperCase(),
            transaction_date: `${txYear}-${String(txMonth).padStart(2, '0')}-15`,
            year: txYear,
            installment_current: i + 1,
            installment_total,
            installment_group_id: groupId,
            usd_amount,
            usd_rate,
            source: 'imported',
          });
        }
      }
      const data = await transactionsService.insertMany(allRows);
      appendTransactions(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { add, addBatch, loading };
}
