import { supabase } from './supabase';

export const categoriesService = {
  async list(type = null) {
    let query = supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(category) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, user_id: session.user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
