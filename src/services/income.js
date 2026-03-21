import { supabase } from './supabase';

export const incomeService = {
  async list(year) {
    const { data, error } = await supabase
      .from('monthly_income')
      .select('*')
      .eq('year', year)
      .eq('currency', 'ARS');
    if (error) throw error;

    const arr = new Array(12).fill(0);
    (data || []).forEach(d => { arr[d.month - 1] = d.amount_cents; });
    return arr;
  },

  async upsert(year, month, amountCents) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('monthly_income')
      .upsert({
        user_id: session.user.id,
        year,
        month,
        amount_cents: amountCents,
        currency: 'ARS',
      }, { onConflict: 'user_id,year,month,currency' });
    if (error) throw error;
  },
};
