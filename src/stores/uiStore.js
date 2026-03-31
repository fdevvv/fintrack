import { create } from 'zustand';
import { UPDATES } from '@/data/updates';

const checkHasNew = () => {
  if (!UPDATES.length) return false;
  try { return UPDATES[0].id !== localStorage.getItem('lastSeenUpdate'); } catch { return false; }
};

export const useUiStore = create((set) => ({
  syncing: false,
  toast: null,
  notifOpen: false,
  notifHasNew: checkHasNew(),
  setSyncing: (v) => set({ syncing: v }),
  showToast: (m, e = false) => set({ toast: { m, e } }),
  clearToast: () => set({ toast: null }),
  openNotif: () => {
    if (UPDATES.length) { try { localStorage.setItem('lastSeenUpdate', UPDATES[0].id); } catch {} }
    set({ notifOpen: true, notifHasNew: false });
  },
  closeNotif: () => set({ notifOpen: false }),
}));
