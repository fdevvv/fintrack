import { supabase } from './supabase';

export const analyticsService = {
  /**
   * Monthly summary (income, expenses, balance) for last N months.
   */
  async getMonthlySummary(months = 6, currency = 'ARS') {
    const { data, error } = await supabase
      .from('monthly_summary')
      .select('*')
      .eq('currency', currency)
      .order('month', { ascending: false })
      .limit(months);

    if (error) throw error;
    return (data || []).reverse();
  },

  /**
   * Category breakdown for a specific month.
   */
  async getCategoryBreakdown(year, month, currency = 'ARS') {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('category_monthly_spending')
      .select('*')
      .eq('currency', currency)
      .eq('month', startDate)
      .order('total_cents', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Compare spending between two months by category.
   */
  async compareMonths(year1, month1, year2, month2, currency = 'ARS') {
    const [current, previous] = await Promise.all([
      this.getCategoryBreakdown(year1, month1, currency),
      this.getCategoryBreakdown(year2, month2, currency),
    ]);

    const previousMap = new Map();
    previous.forEach((p) => previousMap.set(p.category_id, p));

    return current.map((c) => {
      const prev = previousMap.get(c.category_id);
      const prevTotal = prev?.total_cents || 0;
      const diff = c.total_cents - prevTotal;
      const percentChange = prevTotal > 0
        ? Math.round((diff / prevTotal) * 10000) / 100
        : null;

      return {
        ...c,
        previous_total_cents: prevTotal,
        diff_cents: diff,
        percent_change: percentChange,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      };
    });
  },

  /**
   * Track price evolution for a specific item over time.
   */
  async getItemPriceHistory(itemName, currency = 'ARS', limit = 20) {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_name', itemName)
      .eq('currency', currency)
      .order('recorded_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get unique tracked items for autocomplete/search.
   */
  async getTrackedItems(search = '', currency = 'ARS') {
    let query = supabase
      .from('price_history')
      .select('item_name, currency')
      .eq('currency', currency)
      .order('item_name');

    if (search) {
      query = query.ilike('item_name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Deduplicate
    const unique = [...new Set((data || []).map((d) => d.item_name))];
    return unique;
  },

  /**
   * Spending by payment method for a given period.
   */
  async getPaymentMethodBreakdown(year, month, currency = 'ARS') {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('payment_method, amount_cents')
      .eq('type', 'expense')
      .eq('currency', currency)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .is('deleted_at', null);

    if (error) throw error;

    const breakdown = {};
    (data || []).forEach((t) => {
      const method = t.payment_method;
      if (!breakdown[method]) breakdown[method] = { total_cents: 0, count: 0 };
      breakdown[method].total_cents += t.amount_cents;
      breakdown[method].count += 1;
    });

    return breakdown;
  },

  /**
   * Generate alerts: over-budget categories, unusual spending spikes.
   */
  async getAlerts(year, month, currency = 'ARS') {
    const alerts = [];

    // 1. Over-budget alerts
    const { default: budgetsService } = await import('./budgets');
    const budgetsWithSpending = await budgetsService.getWithSpending(year, month, currency);

    budgetsWithSpending.forEach((b) => {
      if (b.is_over_budget) {
        alerts.push({
          type: 'over_budget',
          severity: 'danger',
          category: b.categories?.name,
          icon: b.categories?.icon,
          message: `Superaste el presupuesto de ${b.categories?.name}`,
          details: {
            limit_cents: b.limit_cents,
            spent_cents: b.spent_cents,
            over_by_cents: b.spent_cents - b.limit_cents,
            percent_used: b.percent_used,
          },
        });
      } else if (b.percent_used >= 80) {
        alerts.push({
          type: 'approaching_budget',
          severity: 'warning',
          category: b.categories?.name,
          icon: b.categories?.icon,
          message: `${b.categories?.name}: ${b.percent_used}% del presupuesto usado`,
          details: {
            limit_cents: b.limit_cents,
            spent_cents: b.spent_cents,
            remaining_cents: b.remaining_cents,
            percent_used: b.percent_used,
          },
        });
      }
    });

    // 2. Month-over-month spending spike (>30% increase in any category)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const comparison = await this.compareMonths(year, month, prevYear, prevMonth, currency);

    comparison.forEach((c) => {
      if (c.percent_change !== null && c.percent_change > 30 && c.previous_total_cents > 0) {
        alerts.push({
          type: 'spending_spike',
          severity: 'info',
          category: c.category_name,
          icon: c.category_icon,
          message: `${c.category_name}: +${c.percent_change}% vs mes anterior`,
          details: {
            current_cents: c.total_cents,
            previous_cents: c.previous_total_cents,
            diff_cents: c.diff_cents,
            percent_change: c.percent_change,
          },
        });
      }
    });

    return alerts.sort((a, b) => {
      const severity = { danger: 0, warning: 1, info: 2 };
      return severity[a.severity] - severity[b.severity];
    });
  },

  /**
   * Dashboard summary — single call for all dashboard data.
   */
  async getDashboardData(year, month, currency = 'ARS') {
    const [summary, categoryBreakdown, paymentBreakdown, alerts, monthlySummary] =
      await Promise.all([
        this.getMonthlySummary(1, currency).then((d) => d[0] || null),
        this.getCategoryBreakdown(year, month, currency),
        this.getPaymentMethodBreakdown(year, month, currency),
        this.getAlerts(year, month, currency),
        this.getMonthlySummary(6, currency),
      ]);

    return {
      currentMonth: summary,
      categoryBreakdown,
      paymentBreakdown,
      alerts,
      monthlySummary,
    };
  },
};
