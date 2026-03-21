import { create } from 'zustand';
import { transactionsService } from '@/services/transactions';
import { incomeService } from '@/services/income';
import { yearsService } from '@/services/years';
import { categoriesService } from '@/services/categories';
import { profileService } from '@/services/profile';

export const useStore = create((set, get) => ({
  // State
  year: new Date().getFullYear(),
  years: [new Date().getFullYear()],
  month: new Date().getMonth(), // 0-based
  page: 'dash',
  transactions: [],
  categories: [],
  income: new Array(12).fill(0),
  profile: null,
  budgets: {},
  syncing: false,
  toast: null,

  // Navigation
  setPage: (page) => set({ page }),
  setYear: (year) => { set({ year, month: -1 }); get().loadAll(); },
  setMonth: (month) => set({ month }),

  // Toast
  showToast: (m, e = false) => set({ toast: { m, e } }),
  clearToast: () => set({ toast: null }),

  // Load everything for current year
  loadAll: async () => {
    set({ syncing: true });
    const { year } = get();
    try {
      // First check if user has any years — if not, auto-setup
      let yrs = await yearsService.list();
      if (!yrs.length) {
        // New user — create current year and seed categories
        const currentYear = new Date().getFullYear();
        await yearsService.create(currentYear);
        // Seed categories via RPC (may already exist from trigger, that's ok)
        const { data: { session } } = await (await import('@/services/supabase')).supabase.auth.getSession();
        if (session?.user) {
          try { await (await import('@/services/supabase')).supabase.rpc('seed_default_categories', { p_user_id: session.user.id }); } catch {}
        }
        yrs = [currentYear];
        set({ year: currentYear });
      }

      const activeYear = get().year;
      const [txs, cats, inc, prof] = await Promise.all([
        transactionsService.list(activeYear),
        categoriesService.list(),
        incomeService.list(activeYear),
        profileService.get(),
      ]);
      set({
        transactions: txs,
        categories: cats,
        income: inc,
        profile: prof,
        years: yrs,
        syncing: false,
      });
      // Load budgets from localStorage
      try {
        const stored = localStorage.getItem('ft-budgets');
        if (stored) set({ budgets: JSON.parse(stored) });
      } catch {}
    } catch (err) {
      console.error('loadAll error:', err);
      set({ syncing: false });
    }
  },

  // Transactions
  addTransaction: async (tx) => {
    const data = await transactionsService.create(tx);
    set(s => ({ transactions: [...s.transactions, data] }));
    return data;
  },

  addWithInstallments: async (params) => {
    const data = await transactionsService.createWithInstallments(params);
    set(s => ({ transactions: [...s.transactions, ...data] }));
    return data;
  },

  deleteTransaction: async (id, groupId) => {
    if (groupId) {
      await transactionsService.deleteGroup(groupId);
      set(s => ({ transactions: s.transactions.filter(t => t.installment_group_id !== groupId) }));
    } else {
      await transactionsService.delete(id);
      set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }));
    }
  },

  // Income
  setIncome: async (month, amount) => {
    const { year, income } = get();
    await incomeService.upsert(year, month, amount);
    const newIncome = [...income];
    newIncome[month - 1] = amount;
    set({ income: newIncome });
  },

  // Years
  createYear: async (newYear) => {
    await yearsService.create(newYear);
    set(s => ({ years: [...new Set([...s.years, newYear])].sort() }));
  },

  // Categories
  addCategory: async (name, type) => {
    const cat = await categoriesService.create(name, type);
    set(s => ({ categories: [...s.categories, cat] }));
    return cat;
  },

  // Budgets (local storage for now)
  setBudget: (rubro, monto) => {
    const budgets = { ...get().budgets, [rubro]: monto };
    set({ budgets });
    localStorage.setItem('ft-budgets', JSON.stringify(budgets));
  },

  // Profile
  updateProfile: async (updates) => {
    const data = await profileService.update(updates);
    set({ profile: data });
    return data;
  },
}));
