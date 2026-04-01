import { supabase } from './supabase';

export const sectionsService = {
  async list() {
    const { data, error } = await supabase
      .from('user_sections')
      .select('key, label, is_card')
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async create(key, label, isCard = false) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('user_sections')
      .insert({ key, label, user_id: user.id, is_card: isCard })
      .select('key, label, is_card')
      .single();
    if (error) throw error;
    return data;
  },

  async update(key, newLabel) {
    const { error } = await supabase
      .from('user_sections')
      .update({ label: newLabel })
      .eq('key', key);
    if (error) throw error;
  },

  async remove(key) {
    const { error } = await supabase
      .from('user_sections')
      .delete()
      .eq('key', key);
    if (error) throw error;
  },
};
