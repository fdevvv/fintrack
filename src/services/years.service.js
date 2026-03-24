import { supabase } from './supabase';

export const yearsService = {
  async list() {
    const { data, error } = await supabase
      .from('user_years')
      .select('year')
      .order('year');
    if (error) throw error;
    return (data || []).map(d => d.year);
  },

  async create(year) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('user_years')
      .insert({ user_id: session.user.id, year });
    if (error && !error.message.includes('duplicate')) throw error;
  },
};
