# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on localhost:5173 (Vite + HMR)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint on src/**/*.{js,jsx}
npm run test         # Vitest (unit tests)
npm run test:coverage
```

For Netlify functions locally, run `netlify dev` (proxied at `/.netlify/functions/` → port 9999 by Vite).

## Architecture

### Data Flow

```
Pages (src/pages/)
  → Custom Hooks (src/hooks/)
    → Zustand Stores (useStore, uiStore)
    → Service Layer (src/services/*.service.js)  ← thin Supabase SDK wrappers
      → Supabase (PostgreSQL + RLS)
      → Netlify Functions (batch import / CSV export only)
```

### State Management

- **`src/stores/useStore.js`** — Primary app state: transactions, categories, income, budgets, profiles, yearly data. `loadAll()` fetches everything for the active year/month from Supabase on mount or year change.
- **`src/stores/uiStore.js`** — UI-only state: `syncing` flag, toasts, update notification bell.
- Custom hooks own all side effects and data transformation; services are pure query wrappers.
- Mutations use optimistic updates: update store first, revert on error.

### Routing (App.jsx)

React Router v6. Routes defined in `PAGE_ROUTES` object:

| Path | Page | Purpose |
|------|------|---------|
| `/panel` | DashPage | Monthly dashboard, KPIs, charts |
| `/agregar` | AddPage | Add transaction (supports installments + USD) |
| `/movimientos` | ListPage | Transaction list with filters |
| `/mes` | GastosPage | Monthly budget view |
| `/mes/:YYYY-MM` | MesDetailPage | Month drill-down |
| `/importar` | ImportPage | CSV/PDF batch import |
| `/dolar` | DolarPage | USD/ARS exchange rate tracking |
| `/configuracion` | ConfigPage | Settings, category management |
| `/perfil` | ProfilePage | User profile |
| `/admin` | AdminPage | Admin-only (hardcoded email guard) |

Unauthenticated users see `AuthPage`. Auth state from `useAuth` hook (JWT auto-refresh on window focus).

### Key Conventions

**Money:** All amounts stored as `BIGINT` cents (e.g., $1,234.56 ARS → `123456`). Use `parseARS()` from `src/utils/money.js` for Argentine decimal format input. `Mn` object has `.format()`, `.short()`, `.pct()` formatters. Never use floats for money.

**Soft deletes:** Transactions use a `deleted_at` column — never hard-delete. Services filter `deleted_at IS NULL`.

**Dates:** Stored as `transaction_date DATE`. Use `date-fns` for all date math. Argentine locale: `es` from date-fns.

**Categories:** Unique per `(user_id, name, type)`. `type` is either `"income"` or `"expense"`.

**RLS:** All Supabase tables have Row-Level Security filtering by `user_id`. The anon key is safe to expose; the service role key is backend-only (Netlify functions).

### Netlify Functions

`netlify/functions/transactions.js` handles two routes:
- `POST /batch` — Bulk insert up to 500 transactions (requires Bearer JWT)
- `POST /export` — CSV export by date range (requires Bearer JWT)

Rate-limited to 100 req/min per IP. Uses the service role key (never exposed to frontend).

### PWA & Updates

`vite-plugin-pwa` with Workbox generates the service worker. `vite.config.js` emits `version.json` at build time with a timestamp. `UpdatePrompt` component polls this file and shows an update toast when a new version is detected. `sw.js` and `workbox-*.js` have `no-cache` headers (see `netlify.toml`).

### Utilities

- `src/utils/money.js` — `parseARS()`, `Mn` formatter object
- `src/utils/constants.js` — `SECTIONS`, `MONTHS`, `RUBRO_EMOJI`, `COLORS`, `INVESTMENT_OPTIONS`
- `src/utils/dates.js` — date helpers
- `src/utils/styles.js` — shared inline style objects (`cardStyle`, `tooltipStyle`, etc.)
- `src/utils/pdfParser.js` — PDF text extraction for import

### Database Tables (Supabase)

| Table | Key columns |
|-------|-------------|
| `profiles` | `user_id`, `display_name`, `monthly_income_cents`, `preferred_currency` |
| `transactions` | `amount_cents BIGINT`, `currency`, `type`, `payment_method`, `item_name`, `deleted_at` |
| `categories` | `name`, `icon`, `color`, `type` (income/expense) |
| `budgets` | `limit_cents`, `year`, `month`, `category_id` |
| `user_sections` | `name`, `is_card` (VISA, MC, etc.) |
| `price_history` — Auto-populated on transaction insert, keyed by `item_name` |
| `savings_goals` | Goal tracking |

Materialized view `monthly_balance` pre-computes income/expense/balance per user per month.
