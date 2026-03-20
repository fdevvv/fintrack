import { create } from 'zustand';
import { authService } from '@/services/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        const profile = await authService.getProfile();
        set({ user: session.user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  signUp: async ({ email, password, displayName }) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.signUp({ email, password, displayName });
      set({ user: data.user, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signIn: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.signIn({ email, password });
      const profile = await authService.getProfile();
      set({ user: data.user, profile, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      set({ user: null, profile: null, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateProfile: async (updates) => {
    try {
      const profile = await authService.updateProfile(updates);
      set({ profile });
      return profile;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
