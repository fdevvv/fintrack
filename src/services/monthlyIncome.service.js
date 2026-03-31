import { supabase } from './supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Validates and normalizes a monetary amount.
 * - Rejects NaN, Infinity, negative values → returns 0
 * - Rounds to 2 decimal places
 */
function safeAmount(value) {
  const n = Number(value);
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(Math.max(0, n) * 100) / 100;
}

/**
 * Parses "YYYY-MM" into { year: number, month: number }.
 * Returns null if the format is invalid.
 */
function parseYYYYMM(str) {
  if (!str || typeof str !== 'string') return null;
  const [y, m] = str.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  return { year: y, month: m };
}

/**
 * Generates the last `n` month keys in "YYYY-MM" format, sorted ascending.
 * Example (n=3, today=2025-03): ['2025-01', '2025-02', '2025-03']
 */
function lastNMonthKeys(n = 12) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

// ── Service ───────────────────────────────────────────────────────────────────

export const monthlyIncomeService = {
  /**
   * Returns the income amount for a specific month.
   * Returns 0 if the month has no record.
   *
   * @param {string} userId
   * @param {string} month - Format "YYYY-MM"
   * @returns {Promise<number>}
   */
  async getMonthlyIncome(userId, month) {
    const parsed = parseYYYYMM(month);
    if (!parsed) return 0;

    const { data, error } = await supabase
      .from('monthly_income')
      .select('amount_cents')
      .eq('user_id', userId)
      .eq('year', parsed.year)
      .eq('month', parsed.month)
      .eq('currency', 'ARS')
      .maybeSingle();

    if (error) throw error;
    return safeAmount(data?.amount_cents ?? 0);
  },

  /**
   * Inserts or updates the income for a month.
   * Invalid amounts are stored as 0.
   *
   * @param {string} userId
   * @param {string} month - Format "YYYY-MM"
   * @param {number} amount
   * @returns {Promise<number>} the saved amount
   */
  async upsertMonthlyIncome(userId, month, amount) {
    const parsed = parseYYYYMM(month);
    if (!parsed) throw new Error(`Invalid month format: "${month}". Expected "YYYY-MM".`);

    const safe = safeAmount(amount);

    const { error } = await supabase
      .from('monthly_income')
      .upsert(
        {
          user_id:      userId,
          year:         parsed.year,
          month:        parsed.month,
          amount_cents: Math.round(safe),
          currency:     'ARS',
        },
        { onConflict: 'user_id,year,month,currency' }
      );

    if (error) throw error;
    return safe;
  },

  /**
   * Returns income for the last 12 months sorted ascending.
   * Months with no record are included with amount: 0.
   *
   * @param {string} userId
   * @returns {Promise<Array<{ month: string, amount: number }>>}
   */
  async getMonthlyIncomeHistory(userId) {
    const monthKeys = lastNMonthKeys(12);
    const years = [...new Set(monthKeys.map(k => parseYYYYMM(k).year))];

    const { data, error } = await supabase
      .from('monthly_income')
      .select('year, month, amount_cents')
      .eq('user_id', userId)
      .eq('currency', 'ARS')
      .in('year', years)
      .order('year',  { ascending: true })
      .order('month', { ascending: true });

    if (error) throw error;

    // Build lookup: "YYYY-MM" → amount
    const lookup = {};
    (data || []).forEach(row => {
      const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
      lookup[key] = safeAmount(row.amount_cents ?? 0);
    });

    // Retornar todos los meses con dato real en la DB (incluye futuros)
    return Object.keys(lookup)
      .sort()
      .map(key => ({ month: key, amount: lookup[key] }));
  },
};
