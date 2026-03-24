import { create } from 'zustand';

export const useUiStore = create((set) => ({
  syncing: false,
  toast: null,
  setSyncing: (v) => set({ syncing: v }),
  showToast: (m, e = false) => set({ toast: { m, e } }),
  clearToast: () => set({ toast: null }),
}));
