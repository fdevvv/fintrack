import { supabase } from './supabase';
import { monthlyIncomeService } from './monthlyIncome.service';

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Suma de amount_cents de un array de transacciones filtradas por type.
 * Ignora valores no numéricos o inválidos.
 */
function safeSum(transactions, type) {
  return transactions.reduce((acc, tx) => {
    if (tx.type !== type) return acc;
    const n = Number(tx.amount_cents);
    if (!isFinite(n) || isNaN(n)) return acc;
    return acc + n;
  }, 0);
}

/**
 * Variación porcentual entre current y previous.
 * Retorna 0 si previous es 0 (evita división por cero / Infinity).
 * Redondea a 2 decimales.
 */
function safePct(current, previous) {
  if (!previous || !isFinite(previous)) return 0;
  const result = ((current - previous) / previous) * 100;
  if (!isFinite(result) || isNaN(result)) return 0;
  return Math.round(result * 100) / 100;
}

/**
 * Redondea a 2 decimales de forma segura.
 */
function round2(n) {
  const v = Number(n);
  if (!isFinite(v) || isNaN(v)) return 0;
  return Math.round(v * 100) / 100;
}

// ── Rangos de fecha ────────────────────────────────────────────────────────────

/**
 * Calcula los rangos ISO de mes actual y mes anterior.
 * Maneja correctamente el cambio de año (enero → diciembre del año anterior).
 */
function getMonthRanges() {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-based

  const currentStart = new Date(curYear, curMonth, 1);
  const currentEnd   = new Date(curYear, curMonth + 1, 1); // exclusive

  const prevYear  = curMonth === 0 ? curYear - 1 : curYear;
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;

  const previousStart = new Date(prevYear, prevMonth, 1);
  const previousEnd   = currentStart; // == inicio del mes actual

  return {
    previousStart: previousStart.toISOString(),
    previousEnd:   previousEnd.toISOString(),   // exclusive
    currentStart:  currentStart.toISOString(),
    currentEnd:    currentEnd.toISOString(),     // exclusive
  };
}

// ── Servicio principal ────────────────────────────────────────────────────────

export const analyticsService = {
  /**
   * Compara el mes actual con el mes anterior para un usuario.
   *
   * Hace una sola query a Supabase trayendo ambos meses y los separa en memoria.
   *
   * @param {string} userId
   * @returns {{ current, previous, variation }}
   */
  async getMonthComparison(userId) {
    const EMPTY = { income: 0, expenses: 0, balance: 0 };

    try {
      const { previousStart, previousEnd, currentStart, currentEnd } =
        getMonthRanges();

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Una sola query: trae transacciones de los 2 meses juntos
      const [{ data, error }, monthlyIncome] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount_cents, type, transaction_date')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .gte('transaction_date', previousStart)
          .lt('transaction_date', currentEnd)
          .in('type', ['income', 'expense']),
        monthlyIncomeService.getMonthlyIncome(userId, monthKey),
      ]);

      if (error) throw error;

      const rows = data || [];

      // Separar por mes
      const prevTxs = rows.filter(
        tx => tx.transaction_date >= previousStart && tx.transaction_date < previousEnd
      );
      const currTxs = rows.filter(
        tx => tx.transaction_date >= currentStart && tx.transaction_date < currentEnd
      );

      // Calcular totales con precisión
      const calcTotals = (txs, baseIncome = 0) => {
        const income   = round2(baseIncome + safeSum(txs, 'income'));
        const expenses = round2(safeSum(txs, 'expense'));
        const balance  = round2(income - expenses);
        return { income, expenses, balance };
      };

      const current  = calcTotals(currTxs, monthlyIncome);
      const previous = calcTotals(prevTxs);

      const variation = {
        income:   safePct(current.income,   previous.income),
        expenses: safePct(current.expenses, previous.expenses),
        balance:  safePct(current.balance,  previous.balance),
      };

      return { current, previous, variation };
    } catch {
      return { current: EMPTY, previous: EMPTY, variation: EMPTY };
    }
  },
};
