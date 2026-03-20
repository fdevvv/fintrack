import { create } from 'zustand';
import { analyticsService } from '@/services/analytics';
import { getCurrentMonth } from '@/utils/dates';

export const useDashboardStore = create((set) => ({
  data: null,
  loading: false,
  error: null,
  selectedCurrency: 'ARS',
  selectedPeriod: getCurrentMonth(),

  setCurrency: (currency) => {
    set({ selectedCurrency: currency });
  },

  setPeriod: (year, month) => {
    set({ selectedPeriod: { year, month } });
  },

  fetchDashboard: async () => {
    const state = useDashboardStore.getState();
    const { year, month } = state.selectedPeriod;
    const currency = state.selectedCurrency;

    set({ loading: true, error: null });
    try {
      const data = await analyticsService.getDashboardData(year, month, currency);
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
