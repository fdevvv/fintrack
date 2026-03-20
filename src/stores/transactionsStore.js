import { create } from 'zustand';
import { transactionsService } from '@/services/transactions';
import { validateTransaction } from '@/utils/validation';
import { getCurrentMonth, getMonthRange } from '@/utils/dates';

export const useTransactionsStore = create((set, get) => ({
  transactions: [],
  pagination: null,
  loading: false,
  error: null,
  filters: {
    ...getMonthRange(getCurrentMonth().year, getCurrentMonth().month),
    categoryId: null,
    type: null,
    paymentMethod: null,
    currency: null,
    search: '',
    page: 1,
    pageSize: 50,
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    }));
    get().fetchTransactions();
  },

  resetFilters: () => {
    const { year, month } = getCurrentMonth();
    set({
      filters: {
        ...getMonthRange(year, month),
        categoryId: null,
        type: null,
        paymentMethod: null,
        currency: null,
        search: '',
        page: 1,
        pageSize: 50,
      },
    });
    get().fetchTransactions();
  },

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const result = await transactionsService.list({
        startDate: filters.start,
        endDate: filters.end,
        categoryId: filters.categoryId,
        type: filters.type,
        paymentMethod: filters.paymentMethod,
        currency: filters.currency,
        search: filters.search,
        page: filters.page,
        pageSize: filters.pageSize,
      });
      set({ transactions: result.data, pagination: result.pagination, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createTransaction: async (data) => {
    const validation = validateTransaction(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const created = await transactionsService.create(data);
    // Refresh list to include the new transaction
    await get().fetchTransactions();
    return created;
  },

  updateTransaction: async (id, data) => {
    const updated = await transactionsService.update(id, data);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? updated : t
      ),
    }));
    return updated;
  },

  deleteTransaction: async (id) => {
    await transactionsService.delete(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  setPage: (page) => {
    set((state) => ({ filters: { ...state.filters, page } }));
    get().fetchTransactions();
  },
}));
