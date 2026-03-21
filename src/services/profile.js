import { supabase } from './supabase';

export const profileService = {
  async get() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    return data;
  },

  async update({ display_name, avatar_url }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No auth');
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', session.user.id).select().single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(file) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No auth');
    const ext = file.name.split('.').pop();
    const path = `${session.user.id}/avatar.${ext}`;
    const { data, error } = await supabase.storage.from('tickets').upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('tickets').getPublicUrl(data.path);
    return publicUrl;
  },
};
