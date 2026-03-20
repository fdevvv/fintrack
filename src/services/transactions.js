import { supabase } from './supabase';

export const transactionsService = {
  /**
   * Fetch transactions with filters, pagination, and sorting.
   * RLS ensures only the authenticated user's data is returned.
   */
  async list({
    startDate,
    endDate,
    categoryId,
    type,
    paymentMethod,
    currency,
    search,
    page = 1,
    pageSize = 50,
    sortBy = 'transaction_date',
    sortDir = 'desc',
  } = {}) {
    let query = supabase
      .from('transactions')
      .select('*, categories(name, icon, color)', { count: 'exact' })
      .is('deleted_at', null)
      .order(sortBy, { ascending: sortDir === 'asc' });

    // Apply filters
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (type) query = query.eq('type', type);
    if (paymentMethod) query = query.eq('payment_method', paymentMethod);
    if (currency) query = query.eq('currency', currency);
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,item_name.ilike.%${search}%`
      );
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  },

  async create(transaction) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: session.user.id,
      })
      .select('*, categories(name, icon, color)')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*, categories(name, icon, color)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete — marks as deleted but keeps for audit trail.
   * The deleted_at filter in all queries hides it from the UI.
   */
  async delete(id) {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Batch create for importing multiple transactions.
   */
  async batchCreate(transactions) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const withUserId = transactions.map((t) => ({ ...t, user_id: session.user.id }));

    const { data, error } = await supabase
      .from('transactions')
      .insert(withUserId)
      .select();

    if (error) throw error;
    return data;
  },
};
