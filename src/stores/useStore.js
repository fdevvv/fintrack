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

// ── Cache helpers (stale-while-revalidate) ──────────────────────────────────
const CACHE_V = 'v1';
const _cacheKey = (uid, yr) => `ft_cache_${CACHE_V}_${uid}_${yr}`;
const readCache = (uid, yr) => {
  try { return JSON.parse(localStorage.getItem(_cacheKey(uid, yr)) || 'null'); } catch { return null; }
};
const writeCache = (uid, yr, data) => {
  try { localStorage.setItem(_cacheKey(uid, yr), JSON.stringify(data)); } catch {}
};

// ── Deduplication: prevents concurrent loads for the same user+year ──────────
// Module-level so it survives across React re-renders without polluting state.
let _currentLoadKey = null;
// ───────────────────────────────────────────────────────────────────────────

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
  userId: null,
  loadingYear: false,
  dataReady: false,

  // Navigation
  setPage: (page) => set({ page }),
  setYear: (year) => { set({ year, month: -1 }); get().loadAll(); },
  setMonth: (month) => set({ month }),
  setUserId: (userId) => set((s) => ({
    userId,
    // Resetear dataReady si cambia de usuario para no mostrar datos del usuario anterior
    dataReady: s.userId === userId ? s.dataReady : false,
  })),

  // Load everything for current year — two-phase strategy:
  //   Phase 1: current-month transactions + all small tables → render immediately
  //   Phase 2: full-year transactions arrive silently → charts update
  loadAll: async () => {
    const { year, userId } = get();
    const loadKey = `${userId}_${year}`;

    // Deduplicate: skip if this exact user+year is already loading
    if (_currentLoadKey === loadKey) return;
    _currentLoadKey = loadKey;
    set({ loadingYear: true });

    // ── Stale-while-revalidate: show last session's data instantly ────────
    if (userId) {
      const cached = readCache(userId, year);
      if (cached) {
        set({
          transactions:   cached.transactions   ?? [],
          categories:     cached.categories     ?? [],
          income:         cached.income         ?? new Array(12).fill(0),
          profile:        cached.profile        ?? null,
          budgets:        cached.budgets        ?? {},
          monthlyBalance: cached.monthlyBalance ?? [],
          userSections:   cached.userSections   ?? [],
          years:          cached.years          ?? [year],
          dataReady: true, // hay datos del cache — renderizar ya
        });
      }
    }

    useUiStore.getState().setSyncing(true);
    try {
      const storeMonth = get().month;
      const activeMonth = storeMonth >= 0 ? storeMonth + 1 : new Date().getMonth() + 1;

      // Kick off full-year fetch immediately so it runs in parallel with everything else.
      // We won't await it here — it arrives silently after phase 1.
      const yearTxsPromise = transactionsService.list(year);

      // ── Phase 1: fast queries + current-month transactions ───────────────
      const [yrs, currentTxs, cats, inc, prof, budgetRows, balanceRows, sectionRows] = await Promise.all([
        yearsService.list(),
        transactionsService.listMonth(year, activeMonth),
        categoriesService.list(),
        incomeService.list(year),
        profileService.get(),
        budgetsService.list(year, activeMonth),
        monthlyBalanceService.list(year).catch(e => { console.error('[monthly_balance]', e); return []; }),
        sectionsService.list().catch(e => { console.error('[user_sections]', e); return []; }),
      ]);

      let finalYears = yrs;
      let finalCats  = cats;

      if (!yrs.length) {
        // New user — create year and seed default categories
        const currentYear = new Date().getFullYear();
        await yearsService.create(currentYear);
        const { supabase } = await import('@/services/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          try { await supabase.rpc('seed_default_categories', { p_user_id: session.user.id }); } catch {}
        }
        finalYears = [currentYear];
        set({ year: currentYear });
        finalCats = await categoriesService.list();
      }

      const budgets = {};
      budgetRows.forEach(b => {
        const name = b.categories?.name;
        if (name) budgets[name] = b.limit_cents;
      });

      const baseData = {
        categories: finalCats, income: inc, profile: prof,
        years: finalYears, budgets, monthlyBalance: balanceRows, userSections: sectionRows,
      };

      // Phase 1 complete — datos listos para renderizar
      set({ ...baseData, transactions: currentTxs, dataReady: true });
      useUiStore.getState().setSyncing(false);

      // ── Phase 2: full-year transactions — silent background update ────────
      yearTxsPromise.then(yearTxs => {
        // Discard if user navigated to a different year mid-flight
        if (_currentLoadKey !== loadKey) return;
        _currentLoadKey = null;
        set({ transactions: yearTxs, loadingYear: false });
        if (userId) writeCache(userId, year, { ...baseData, transactions: yearTxs });
      }).catch(err => {
        console.error('[loadAll phase2]', err);
        if (_currentLoadKey === loadKey) { _currentLoadKey = null; set({ loadingYear: false }); }
      });

    } catch (err) {
      console.error('[loadAll]', err);
      if (_currentLoadKey === loadKey) { _currentLoadKey = null; set({ loadingYear: false }); }
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
  addCategory: async (name, type, icon) => {
    const cat = await categoriesService.create(name, type, icon);
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
