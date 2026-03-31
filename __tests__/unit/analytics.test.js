// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase ─────────────────────────────────────────────────────────────
// El servicio importa desde '@/services/supabase' vía alias Vite.
// Necesitamos interceptar esa llamada antes del import del servicio.

let mockQueryResult = { data: [], error: null };

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            gte: () => ({
              lt: () => ({
                in: () => Promise.resolve(mockQueryResult),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@/services/monthlyIncome.service', () => ({
  monthlyIncomeService: { getMonthlyIncome: () => Promise.resolve(0) },
}));

// Import después del mock
const { analyticsService } = await import('@/services/analytics.service');

// ── Helpers de fixture ────────────────────────────────────────────────────────

const USER_ID = 'user-test-123';

/** Construye una transacción dentro del mes actual (día 5). */
function txCurrentMonth(type, amount) {
  const d = new Date();
  d.setDate(5);
  return { type, amount_cents: amount, transaction_date: d.toISOString() };
}

/** Construye una transacción dentro del mes anterior (día 5). */
function txPreviousMonth(type, amount) {
  const d = new Date();
  d.setDate(5);
  if (d.getMonth() === 0) {
    d.setFullYear(d.getFullYear() - 1);
    d.setMonth(11);
  } else {
    d.setMonth(d.getMonth() - 1);
  }
  return { type, amount_cents: amount, transaction_date: d.toISOString() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('analyticsService.getMonthComparison', () => {
  beforeEach(() => {
    mockQueryResult = { data: [], error: null };
  });

  // ── Caso base ──────────────────────────────────────────────────────────────

  it('retorna ceros cuando no hay transacciones', async () => {
    mockQueryResult = { data: [], error: null };

    const result = await analyticsService.getMonthComparison(USER_ID);

    expect(result.current).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(result.previous).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(result.variation).toEqual({ income: 0, expenses: 0, balance: 0 });
  });

  // ── Cálculo de totales ─────────────────────────────────────────────────────

  it('calcula income, expenses y balance del mes actual', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 100000),
        txCurrentMonth('income', 50000),
        txCurrentMonth('expense', 30000),
        txCurrentMonth('expense', 20000),
      ],
      error: null,
    };

    const { current } = await analyticsService.getMonthComparison(USER_ID);

    expect(current.income).toBe(150000);
    expect(current.expenses).toBe(50000);
    expect(current.balance).toBe(100000);
  });

  it('calcula income, expenses y balance del mes anterior', async () => {
    mockQueryResult = {
      data: [
        txPreviousMonth('income', 80000),
        txPreviousMonth('expense', 40000),
      ],
      error: null,
    };

    const { previous } = await analyticsService.getMonthComparison(USER_ID);

    expect(previous.income).toBe(80000);
    expect(previous.expenses).toBe(40000);
    expect(previous.balance).toBe(40000);
  });

  it('separa correctamente transacciones de mes actual y anterior', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 100000),
        txCurrentMonth('expense', 30000),
        txPreviousMonth('income', 80000),
        txPreviousMonth('expense', 20000),
      ],
      error: null,
    };

    const { current, previous } = await analyticsService.getMonthComparison(USER_ID);

    expect(current.income).toBe(100000);
    expect(current.expenses).toBe(30000);
    expect(previous.income).toBe(80000);
    expect(previous.expenses).toBe(20000);
  });

  // ── Variación porcentual ───────────────────────────────────────────────────

  it('calcula variación porcentual correctamente', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 120000),   // +20% vs 100000
        txCurrentMonth('expense', 60000),   // +50% vs 40000
        txPreviousMonth('income', 100000),
        txPreviousMonth('expense', 40000),
      ],
      error: null,
    };

    const { variation } = await analyticsService.getMonthComparison(USER_ID);

    expect(variation.income).toBe(20);
    expect(variation.expenses).toBe(50);
  });

  it('retorna variación 0 cuando previous es 0 (evita división por cero)', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 50000),
        // sin transacciones del mes anterior
      ],
      error: null,
    };

    const { variation } = await analyticsService.getMonthComparison(USER_ID);

    expect(variation.income).toBe(0);
    expect(variation.expenses).toBe(0);
    expect(variation.balance).toBe(0);
  });

  it('redondea variación a 2 decimales', async () => {
    // 1/3 * 100 = 33.333...
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 4000),
        txPreviousMonth('income', 3000),
      ],
      error: null,
    };

    const { variation } = await analyticsService.getMonthComparison(USER_ID);

    // (4000 - 3000) / 3000 * 100 = 33.33...
    expect(variation.income).toBe(33.33);
  });

  it('redondea totales a 2 decimales', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 1001),
        txCurrentMonth('expense', 334),
      ],
      error: null,
    };

    const { current } = await analyticsService.getMonthComparison(USER_ID);

    expect(current.income).toBe(1001);
    expect(current.expenses).toBe(334);
    expect(current.balance).toBe(667);
    expect(Number.isFinite(current.balance)).toBe(true);
  });

  // ── Validaciones financieras ───────────────────────────────────────────────

  it('ignora transacciones con amount_cents nulo', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 50000),
        { ...txCurrentMonth('income', null), amount_cents: null },
        { ...txCurrentMonth('income', undefined), amount_cents: undefined },
      ],
      error: null,
    };

    const { current } = await analyticsService.getMonthComparison(USER_ID);

    expect(current.income).toBe(50000);
  });

  it('ignora transacciones con amount_cents NaN', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('expense', 20000),
        { ...txCurrentMonth('expense', NaN), amount_cents: NaN },
        { ...txCurrentMonth('expense', 'invalid'), amount_cents: 'invalid' },
      ],
      error: null,
    };

    const { current } = await analyticsService.getMonthComparison(USER_ID);

    expect(current.expenses).toBe(20000);
  });

  it('no produce NaN ni Infinity en el resultado', async () => {
    mockQueryResult = {
      data: [
        { ...txCurrentMonth('income', null), amount_cents: null },
        { ...txCurrentMonth('expense', undefined), amount_cents: undefined },
      ],
      error: null,
    };

    const { current, previous, variation } = await analyticsService.getMonthComparison(USER_ID);

    for (const section of [current, previous, variation]) {
      for (const val of Object.values(section)) {
        expect(Number.isFinite(val)).toBe(true);
        expect(Number.isNaN(val)).toBe(false);
      }
    }
  });

  // ── Balance negativo ───────────────────────────────────────────────────────

  it('calcula balance negativo correctamente (gastos > ingresos)', async () => {
    mockQueryResult = {
      data: [
        txCurrentMonth('income', 30000),
        txCurrentMonth('expense', 50000),
      ],
      error: null,
    };

    const { current } = await analyticsService.getMonthComparison(USER_ID);

    expect(current.balance).toBe(-20000);
  });

  // ── Error de Supabase ──────────────────────────────────────────────────────

  it('retorna ceros cuando Supabase devuelve error (fallback seguro)', async () => {
    mockQueryResult = { data: null, error: new Error('DB connection failed') };

    const result = await analyticsService.getMonthComparison(USER_ID);

    expect(result.current).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(result.previous).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(result.variation).toEqual({ income: 0, expenses: 0, balance: 0 });
  });

  // ── Estructura del retorno ─────────────────────────────────────────────────

  it('siempre retorna la estructura esperada { current, previous, variation }', async () => {
    const result = await analyticsService.getMonthComparison(USER_ID);

    expect(result).toHaveProperty('current');
    expect(result).toHaveProperty('previous');
    expect(result).toHaveProperty('variation');

    for (const section of ['current', 'previous', 'variation']) {
      expect(result[section]).toHaveProperty('income');
      expect(result[section]).toHaveProperty('expenses');
      expect(result[section]).toHaveProperty('balance');
    }
  });
});
