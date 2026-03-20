# FinTrack — Control Inteligente de Gastos

App web fintech para control de gastos personales con soporte multi-moneda (ARS/USD), tracking de precios, presupuestos con alertas, y análisis comparativo mes a mes.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand + Recharts
- **Backend**: Supabase (PostgreSQL + Auth + RLS) + Netlify Functions
- **Deploy**: Netlify (free tier)
- **Precisión monetaria**: Integer cents (BIGINT) — nunca floats

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Frontend (React SPA en Netlify CDN)            │
│  Zustand stores → Supabase client-side SDK      │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS + JWT (RLS)
┌─────────────────▼───────────────────────────────┐
│  Supabase (PostgreSQL)                          │
│  • Row-Level Security por user_id               │
│  • Views pre-computadas para analytics          │
│  • Triggers para price tracking automático      │
└─────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  Netlify Functions (serverless, solo para       │
│  batch import y CSV export)                     │
└─────────────────────────────────────────────────┘
```

## Setup

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com) (free tier)
2. Ir a SQL Editor y ejecutar el contenido de `supabase/migrations/001_initial_schema.sql`
3. Copiar la URL del proyecto y las keys (anon + service role)

### 2. Variables de entorno

```bash
cp .env.example .env
```

Completar con los valores de Supabase:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Desarrollo local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173`.

### 4. Tests

```bash
npm test
```

### 5. Deploy a Netlify

1. Conectar el repo en [netlify.com](https://netlify.com)
2. En Site Settings → Environment Variables, agregar las 3 variables del `.env`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy automático en cada push

## Estructura del proyecto

```
fintrack/
├── src/
│   ├── components/
│   │   ├── ui/          # Componentes reutilizables (Button, Card, Modal, Input)
│   │   ├── layout/      # AppLayout con sidebar
│   │   ├── auth/        # Login/Signup
│   │   └── transactions/ # TransactionFormModal
│   ├── pages/           # Páginas principales
│   │   ├── DashboardPage.jsx    # Resumen, alertas, gráficos
│   │   ├── TransactionsPage.jsx # CRUD con filtros
│   │   ├── BudgetsPage.jsx      # Presupuestos con progress bars
│   │   ├── AnalyticsPage.jsx    # Comparación mes a mes
│   │   ├── PricesPage.jsx       # Tracking de precios por item
│   │   └── SettingsPage.jsx     # Perfil y preferencias
│   ├── stores/          # Zustand stores (auth, transactions, dashboard)
│   ├── services/        # Supabase queries (auth, transactions, budgets, analytics)
│   ├── utils/           # Money, validation, dates
│   └── styles/          # Global CSS
├── netlify/functions/   # Serverless API (batch import, CSV export)
├── supabase/migrations/ # SQL schema
├── __tests__/           # Vitest tests
└── netlify.toml         # Deploy config
```

## Modelo de datos

### Decisiones clave

| Decisión | Justificación |
|----------|---------------|
| BIGINT para montos | Los floats causan errores de precisión con dinero. $150.50 se guarda como `15050` |
| Row-Level Security | Cada query se filtra por `user_id` a nivel de DB. Un usuario NUNCA puede ver datos de otro |
| Soft delete | `deleted_at` en transactions permite auditoría sin perder datos |
| Composite indexes | `(user_id, transaction_date DESC)` optimiza las queries más frecuentes |
| Views materializadas | `monthly_summary` y `category_monthly_spending` pre-computan analytics |
| Trigger de precio | Auto-inserta en `price_history` cuando una transacción tiene `item_name` |

### Tablas

- **profiles**: Extiende auth.users de Supabase
- **categories**: Categorías personalizadas por usuario (con defaults para nuevos usuarios)
- **transactions**: Ingresos y gastos con método de pago, item name, y soft delete
- **budgets**: Límites mensuales por categoría
- **price_history**: Evolución de precios por item (auto-tracking)

## Funcionalidades

### Core
- ✅ CRUD de transacciones con validación
- ✅ Filtros por fecha, categoría, tipo, método de pago
- ✅ Multi-moneda (ARS / USD)
- ✅ Métodos de pago: Efectivo, Transferencia, QR Débito, Tarjeta débito/crédito

### Presupuestos
- ✅ Límites mensuales por categoría
- ✅ Progress bars con gasto actual vs límite
- ✅ Alertas automáticas al superar 80% o 100%

### Analytics
- ✅ Dashboard con ingresos, gastos y balance del mes
- ✅ Gráfico de evolución mensual (6 meses)
- ✅ Pie chart por categoría
- ✅ Comparación mes a mes con % de cambio
- ✅ Desglose por método de pago

### Tracking de precios
- ✅ Seguimiento automático de precios por item
- ✅ Gráfico de evolución de precio
- ✅ Detección de aumentos (% de cambio)
- ✅ Búsqueda de items trackeados

### Seguridad
- ✅ Auth con Supabase (email + password)
- ✅ JWT con auto-refresh
- ✅ Row-Level Security en todas las tablas
- ✅ Input sanitization (XSS prevention)
- ✅ Rate limiting en Netlify Functions
- ✅ Soft delete para auditoría

## Seguridad — Análisis de vulnerabilidades

| Riesgo | Mitigación |
|--------|------------|
| SQL Injection | Supabase SDK usa prepared statements. Nunca raw SQL desde el cliente |
| XSS | Sanitización de inputs en `validation.js`. React escapa HTML por defecto |
| CSRF | Supabase usa JWT en headers, no cookies. CSRF no aplica |
| Data leaks | RLS garantiza aislamiento a nivel DB. El `anon_key` solo permite acceso autenticado |
| Brute force | Supabase rate-limits auth endpoints. Netlify Functions tiene rate limiter propio |
| Float precision | BIGINT cents elimina errores de redondeo en montos |
| Token exposure | `SUPABASE_SERVICE_ROLE_KEY` solo vive en Netlify env vars, nunca en el cliente |

## Licencia

MIT
