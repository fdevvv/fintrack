import { create } from 'zustand';
import { transactionsService } from '@/services/transactions.service';
import { incomeService } from '@/services/income.service';
import { yearsService } from '@/services/years.service';
import { categoriesService } from '@/services/categories.service';
import { profileService } from '@/services/profile.service';
import { budgetsService } from '@/services/budgets.service';
import { monthlyBalanceService } from '@/services/monthlyBalance.service';
import { sectionsService } from '@/services/sections.service';
import { useUiStore } from '@/stores/uiStore';

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
  monthlyBalance: [],
  userSections: [],

  // Navigation
  setPage: (page) => set({ page }),
  setYear: (year) => { set({ year, month: -1 }); get().loadAll(); },
  setMonth: (month) => set({ month }),

  // Load everything for current year
  loadAll: async () => {
    useUiStore.getState().setSyncing(true);
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
      const storeMonth = get().month;
      const activeMonth = storeMonth >= 0 ? storeMonth + 1 : new Date().getMonth() + 1;
      const [txs, cats, inc, prof, budgetRows] = await Promise.all([
        transactionsService.list(activeYear),
        categoriesService.list(),
        incomeService.list(activeYear),
        profileService.get(),
        budgetsService.list(activeYear, activeMonth),
      ]);
      const budgets = {};
      budgetRows.forEach(b => {
        const name = b.categories?.name;
        if (name) budgets[name] = b.limit_cents;
      });
      set({ transactions: txs, categories: cats, income: inc, profile: prof, years: yrs, budgets });

      // Carga separada — no bloquea si la view aún no fue aplicada en Supabase
      try {
        const balanceRows = await monthlyBalanceService.list(activeYear);
        console.log('[monthly_balance] rows:', balanceRows);
        set({ monthlyBalance: balanceRows });
      } catch (balanceErr) {
        console.error('[monthly_balance] error:', balanceErr);
      }

      try {
        const sectionRows = await sectionsService.list();
        set({ userSections: sectionRows });
      } catch (secErr) {
        console.error('[user_sections] error:', secErr);
      }
      useUiStore.getState().setSyncing(false);
    } catch (err) {
      console.error('loadAll error:', err);
      useUiStore.getState().setSyncing(false);
    }
  },

  // Transactions (pure state setters — logic lives in hooks)
  appendTransactions: (rows) => set(s => ({ transactions: [...s.transactions, ...(Array.isArray(rows) ? rows : [rows])] })),
  removeTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),
  removeTransactionGroup: (groupId) => set(s => ({ transactions: s.transactions.filter(t => t.installment_group_id !== groupId) })),
  renameTransactionGroup: (groupId, name) => set(s => ({ transactions: s.transactions.map(t => t.installment_group_id === groupId ? { ...t, item_name: name, description: name } : t) })),

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

  // Budgets (Supabase)
  setBudget: async (rubroName, limitCents) => {
    const { year, month: storeMonth, categories, budgets } = get();
    const month = storeMonth >= 0 ? storeMonth + 1 : new Date().getMonth() + 1;
    const cat = categories.find(c => c.name === rubroName && c.type === 'expense');

    // Optimistic update
    const newBudgets = { ...budgets };
    if (limitCents > 0) newBudgets[rubroName] = limitCents;
    else delete newBudgets[rubroName];
    set({ budgets: newBudgets });

    if (!cat) return;
    if (limitCents > 0) {
      await budgetsService.upsert({ category_id: cat.id, year, month, limit_cents: limitCents, currency: 'ARS' });
    } else {
      await budgetsService.deleteByCategory(cat.id, year, month);
    }
  },

  // Sections
  addSection: async (key, label, isCard = false) => {
    const sec = await sectionsService.create(key, label, isCard);
    set(s => ({ userSections: [...s.userSections, sec] }));
    return sec;
  },
  updateSection: async (key, newLabel) => {
    await sectionsService.update(key, newLabel);
    set(s => ({ userSections: s.userSections.map(sec => sec.key === key ? { ...sec, label: newLabel } : sec) }));
  },
  removeSection: async (key) => {
    await sectionsService.remove(key);
    set(s => ({ userSections: s.userSections.filter(sec => sec.key !== key) }));
  },

  // Profile
  updateProfile: async (updates) => {
    const data = await profileService.update(updates);
    set({ profile: data });
    return data;
  },
}));
