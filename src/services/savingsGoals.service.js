import { supabase } from './supabase';

export const savingsGoalsService = {
  async list() {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async create({ name, target_amount, saved_amount, deadline }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({ user_id: user.id, name, target_amount, saved_amount, deadline: deadline || null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSaved(id, saved_amount) {
    const { error } = await supabase
      .from('savings_goals')
      .update({ saved_amount })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
