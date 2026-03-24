import { supabase } from './supabase';

export const categoriesService = {
  async list() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async create(name, type = 'expense', icon = '📎', color = '#707888') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No auth');
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: session.user.id, name, type, icon, color, editable: true })
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
    // Set transactions with this category to null first
    await supabase.from('transactions').update({ category_id: null }).eq('category_id', id);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },
};
