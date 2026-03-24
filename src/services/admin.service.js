import { supabase } from './supabase';

export const adminService = {
  async getUsers() {
    const { data, error } = await supabase.rpc('get_users_admin');
    if (error) throw error;
    return data || [];
  },
};
