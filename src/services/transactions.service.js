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

  async insertMany(rows) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('transactions')
      .insert(rows.map(r => ({ ...r, user_id: session.user.id })))
      .select('*, categories(name, icon, color)');
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('installment_group_id', groupId);
    if (error) throw error;
  },

  async updateName(groupId, name) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');
    const { error } = await supabase
      .from('transactions')
      .update({ item_name: name, description: name })
      .eq('installment_group_id', groupId)
      .eq('user_id', session.user.id);
    if (error) throw error;
  },

  async updateUsdRate(id, amountCents, rate) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');
    const { error } = await supabase
      .from('transactions')
      .update({ amount_cents: amountCents, usd_rate: rate })
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) throw error;
  },
};
