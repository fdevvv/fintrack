import { supabase } from './supabase';

export const budgetsService = {
  async list(year, month, currency = null) {
    let query = supabase
      .from('budgets')
      .select('*, categories(name, icon, color)')
      .eq('year', year)
      .eq('month', month)
      .order('created_at');

    if (currency) query = query.eq('currency', currency);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async upsert(budget) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        { ...budget, user_id: session.user.id },
        { onConflict: 'user_id,category_id,year,month,currency' }
      )
      .select('*, categories(name, icon, color)')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get budgets with actual spending for a given month.
   * Returns each budget with its current spending and remaining amount.
   */
  async getWithSpending(year, month, currency = 'ARS') {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const [budgetsResult, spendingResult] = await Promise.all([
      this.list(year, month, currency),
      supabase
        .from('category_monthly_spending')
        .select('*')
        .eq('currency', currency)
        .eq('month', startDate),
    ]);

    if (spendingResult.error) throw spendingResult.error;

    const spendingMap = new Map();
    (spendingResult.data || []).forEach((s) => {
      spendingMap.set(s.category_id, s);
    });

    return budgetsResult.map((budget) => {
      const spending = spendingMap.get(budget.category_id);
      const spentCents = spending?.total_cents || 0;
      const remainingCents = budget.limit_cents - spentCents;
      const percentUsed = budget.limit_cents > 0
        ? Math.round((spentCents / budget.limit_cents) * 100)
        : 0;

      return {
        ...budget,
        spent_cents: spentCents,
        remaining_cents: remainingCents,
        percent_used: percentUsed,
        is_over_budget: spentCents > budget.limit_cents,
        transaction_count: spending?.transaction_count || 0,
      };
    });
  },
};
