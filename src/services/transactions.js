import { supabase } from './supabase';

export const transactionsService = {
  async list(year) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .eq('year', year)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(tx) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: session.user.id })
      .select('*, categories(name, icon, color)')
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Create a gasto with installments (cuotas).
   * Creates N transactions, one per month, linked by installment_group_id.
   */
  async createWithInstallments({ item_name, description, category_id, section, amount_per_installment, installment_total, start_month, year, currency, payment_method, usd_amount, usd_rate, ticket_items, ticket_image_url, ticket_total, source = 'manual' }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const groupId = crypto.randomUUID();
    const rows = [];

    for (let i = 0; i < installment_total; i++) {
      const monthIdx = (start_month - 1) + i; // 0-based
      if (monthIdx >= 12) break; // don't overflow year

      const txDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-15`;
      rows.push({
        user_id: session.user.id,
        category_id,
        amount_cents: amount_per_installment,
        currency: currency || 'ARS',
        type: 'expense',
        payment_method: payment_method || 'credit_card',
        section: section || 'OTROS',
        description: description || item_name,
        item_name,
        transaction_date: txDate,
        year,
        installment_current: i + 1,
        installment_total,
        installment_group_id: groupId,
        usd_amount: usd_amount || null,
        usd_rate: usd_rate || null,
        ticket_items: (i === 0 && ticket_items) ? ticket_items : null,
        ticket_image_url: (i === 0 && ticket_image_url) ? ticket_image_url : null,
        ticket_total: (i === 0 && ticket_total) ? ticket_total : null,
        source,
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select('*, categories(name, icon, color)');
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Delete all installments in a group (soft delete).
   */
  async deleteGroup(groupId) {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('installment_group_id', groupId);
    if (error) throw error;
  },

  /**
   * Update all USD transactions with a new rate.
   */
  async syncUsdRates(year, newRate) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data: usdTxs } = await supabase
      .from('transactions')
      .select('id, usd_amount, installment_total')
      .eq('year', year)
      .eq('user_id', session.user.id)
      .not('usd_amount', 'is', null)
      .is('deleted_at', null);

    if (!usdTxs?.length) return 0;

    let count = 0;
    for (const tx of usdTxs) {
      const newAmount = Math.round(tx.usd_amount * newRate);
      await supabase
        .from('transactions')
        .update({ amount_cents: newAmount, usd_rate: newRate })
        .eq('id', tx.id);
      count++;
    }
    return count;
  },
};
