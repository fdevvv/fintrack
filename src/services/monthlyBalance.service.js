import { supabase } from './supabase';

export const monthlyBalanceService = {
  /**
   * Fetch monthly_balance view rows for a given year.
   * Returns one row per month that has data.
   * Columns: year, month (1-12), ingreso_neto, cuotas_mes_anterior,
   *          disponible_inicial, gastos_mes, disponible_actual
   */
  async list(year) {
    const { data, error } = await supabase
      .from('monthly_balance')
      .select('year, month, ingreso_neto, gastos_mes, disponible_actual')
      .eq('year', year)
      .order('month');
    if (error) throw error;
    return data || [];
  },
};
