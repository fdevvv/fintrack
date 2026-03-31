// @vitest-environment node
/**
 * Tests financieros para analyticsService.getMonthComparison
 *
 * Foco: precisión numérica, nunca NaN/Infinity, exactitud a 2 decimales.
 * Supabase mockeado — sin llamadas reales a la BD.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

let _mockData = [];
let _mockError = null;
let _mockMonthlyIncome = 0;

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            gte: () => ({
              lt: () => ({
                in: () => Promise.resolve({ data: _mockData, error: _mockError }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@/services/monthlyIncome.service', () => ({
  monthlyIncomeService: {
    getMonthlyIncome: () => Promise.resolve(_mockMonthlyIncome),
  },
}));

const { analyticsService } = await import('@/services/analytics.service');

// ── Helpers de fixture ────────────────────────────────────────────────────────

/** Fecha ISO dentro del mes actual (día 10). */
function dateCurrentMonth() {
  const d = new Date();
  d.setDate(10);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

/** Fecha ISO dentro del mes anterior (día 10, con manejo de enero → diciembre). */
function datePreviousMonth() {
  const d = new Date();
  d.setDate(10);
  d.setHours(12, 0, 0, 0);
  if (d.getMonth() === 0) {
    d.setFullYear(d.getFullYear() - 1);
    d.setMonth(11);
  } else {
    d.setMonth(d.getMonth() - 1);
  }
  return d.toISOString();
}

const CUR  = dateCurrentMonth();
const PREV = datePreviousMonth();

/** Crea una transacción de ingreso. */
const income   = (amount, date = CUR)  => ({ type: 'income',  amount_cents: amount, transaction_date: date });
/** Crea una transacción de gasto. */
const expense  = (amount, date = CUR)  => ({ type: 'expense', amount_cents: amount, transaction_date: date });

/** Configura los datos que devolverá el mock de Supabase. */
function setMock(rows, error = null) {
  _mockData  = rows;
  _mockError = error;
}

/** Configura el ingreso mensual que devolverá getMonthlyIncome. */
function setMonthlyIncome(amount) {
  _mockMonthlyIncome = amount;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getMonthComparison — cálculos financieros', () => {
  beforeEach(() => {
    _mockData          = [];
    _mockError         = null;
    _mockMonthlyIncome = 0;
  });

  // 1. Suma de ingresos ───────────────────────────────────────────────────────
  it('suma correctamente múltiples ingresos del mes actual', async () => {
    setMock([
      income(50000),
      income(30000),
      income(20000),
    ]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.income).toBe(100000);
  });

  // 2. Suma de gastos ─────────────────────────────────────────────────────────
  it('suma correctamente múltiples gastos del mes actual', async () => {
    setMock([
      expense(15000),
      expense(8000),
      expense(2000),
    ]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.expenses).toBe(25000);
  });

  // 3. Balance = income − expenses ───────────────────────────────────────────
  it('calcula balance como income − expenses', async () => {
    setMock([
      income(100000),
      expense(40000),
      expense(25000),
    ]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.income).toBe(100000);
    expect(current.expenses).toBe(65000);
    expect(current.balance).toBe(35000);
  });

  it('balance negativo cuando gastos superan ingresos', async () => {
    setMock([
      income(30000),
      expense(50000),
    ]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.balance).toBe(-20000);
  });

  // 4. Variación % con números reales ────────────────────────────────────────
  it('calcula variación correcta: +50% en ingresos', async () => {
    setMock([
      income(150000),          // mes actual
      income(100000, PREV),    // mes anterior
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    // (150000 - 100000) / 100000 * 100 = 50.00
    expect(variation.income).toBe(50);
  });

  it('calcula variación negativa: −25% en gastos', async () => {
    setMock([
      expense(30000),          // mes actual
      expense(40000, PREV),    // mes anterior
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    // (30000 - 40000) / 40000 * 100 = -25.00
    expect(variation.expenses).toBe(-25);
  });

  it('redondea variación a exactamente 2 decimales (1/3 → 33.33%)', async () => {
    setMock([
      income(4000),
      income(3000, PREV),
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    // (4000 - 3000) / 3000 * 100 = 33.3333...
    expect(variation.income).toBe(33.33);
  });

  // 5. previous = 0 → variación = 0 ─────────────────────────────────────────
  it('retorna variación 0 cuando mes anterior no tiene ingresos (no Infinity)', async () => {
    setMock([
      income(80000),
      // sin datos del mes anterior
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    expect(variation.income).toBe(0);
    expect(variation.income).not.toBe(Infinity);
    expect(Number.isFinite(variation.income)).toBe(true);
  });

  it('retorna variación 0 cuando mes anterior no tiene gastos (no Infinity)', async () => {
    setMock([
      expense(20000),
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    expect(variation.expenses).toBe(0);
    expect(Number.isFinite(variation.expenses)).toBe(true);
  });

  // 6. Datos vacíos → todo en 0 ──────────────────────────────────────────────
  it('retorna ceros cuando no hay transacciones', async () => {
    setMock([]);

    const { current, previous, variation } = await analyticsService.getMonthComparison('u1');

    expect(current).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(previous).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(variation).toEqual({ income: 0, expenses: 0, balance: 0 });
  });

  it('retorna ceros cuando Supabase devuelve null (error de conexión)', async () => {
    setMock(null, new Error('connection failed'));

    const { current, previous, variation } = await analyticsService.getMonthComparison('u1');

    expect(current).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(previous).toEqual({ income: 0, expenses: 0, balance: 0 });
    expect(variation).toEqual({ income: 0, expenses: 0, balance: 0 });
  });

  // 7. Valores decimales ─────────────────────────────────────────────────────
  it('suma valores decimales correctamente: 10.55 + 20.10 = 30.65', async () => {
    setMock([
      income(10.55),
      income(20.10),
    ]);

    const { current } = await analyticsService.getMonthComparison('u1');

    // Float puro daría 30.650000000000002 — round2 debe corregir
    expect(current.income).toBe(30.65);
  });

  it('balance con decimales redondeado a 2 lugares: 100.33 - 50.11 = 50.22', async () => {
    setMock([
      income(100.33),
      expense(50.11),
    ]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.balance).toBe(50.22);
  });

  it('variación con decimales redondeada a 2 lugares', async () => {
    setMock([
      income(105.50),
      income(100.00, PREV),
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    // (105.50 - 100) / 100 * 100 = 5.50
    expect(variation.income).toBe(5.5);
  });

  // ── Validaciones: nunca NaN / Infinity ─────────────────────────────────────
  it('nunca produce NaN en ningún campo del resultado', async () => {
    setMock([
      { type: 'income',  amount_cents: null,      transaction_date: CUR },
      { type: 'expense', amount_cents: undefined,  transaction_date: CUR },
      { type: 'income',  amount_cents: NaN,        transaction_date: CUR },
      { type: 'expense', amount_cents: 'abc',      transaction_date: CUR },
    ]);

    const { current, previous, variation } = await analyticsService.getMonthComparison('u1');

    for (const section of [current, previous, variation]) {
      for (const [key, val] of Object.entries(section)) {
        expect(Number.isNaN(val), `${key} no debe ser NaN`).toBe(false);
      }
    }
  });

  it('nunca produce Infinity en ningún campo del resultado', async () => {
    setMock([
      income(50000),
      // previous = 0 → podría causar Infinity en variación si no se protege
    ]);

    const { variation } = await analyticsService.getMonthComparison('u1');

    for (const [key, val] of Object.entries(variation)) {
      expect(isFinite(val), `${key} no debe ser Infinity`).toBe(true);
    }
  });

  it('todos los valores son números finitos con cualquier input', async () => {
    setMock([
      income(200000),
      expense(80000),
      income(150000, PREV),
      expense(60000, PREV),
    ]);

    const { current, previous, variation } = await analyticsService.getMonthComparison('u1');

    for (const section of [current, previous, variation]) {
      for (const val of Object.values(section)) {
        expect(typeof val).toBe('number');
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });

  // 8. monthly_income + transacciones ────────────────────────────────────────
  it('suma monthly_income al income de transacciones del mes actual', async () => {
    setMonthlyIncome(50000);
    setMock([income(30000)]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.income).toBe(80000); // 50000 + 30000
  });

  it('balance refleja monthly_income en el income base', async () => {
    setMonthlyIncome(80000);
    setMock([expense(30000)]);

    const { current } = await analyticsService.getMonthComparison('u1');

    expect(current.income).toBe(80000);
    expect(current.expenses).toBe(30000);
    expect(current.balance).toBe(50000);
  });
});
