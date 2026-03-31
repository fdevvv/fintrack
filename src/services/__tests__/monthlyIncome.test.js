// @vitest-environment node
/**
 * Tests para monthlyIncomeService
 *
 * Cubre: getMonthlyIncome, upsertMonthlyIncome, getMonthlyIncomeHistory.
 * Supabase completamente mockeado — sin llamadas reales a BD.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock de Supabase ──────────────────────────────────────────────────────────
// El chain es thenable para soportar await en cualquier punto de la cadena.

let _result = { data: null, error: null };

const chain = {
  select:      vi.fn().mockReturnThis(),
  eq:          vi.fn().mockReturnThis(),
  in:          vi.fn().mockReturnThis(),
  order:       vi.fn().mockReturnThis(),
  upsert:      vi.fn(() => Promise.resolve(_result)),
  maybeSingle: vi.fn(() => Promise.resolve(_result)),
  then:        (res, rej) => Promise.resolve(_result).then(res, rej),
  catch:       (rej)      => Promise.resolve(_result).catch(rej),
};

vi.mock('@/services/supabase', () => ({
  supabase: { from: vi.fn(() => chain) },
}));

const { monthlyIncomeService } = await import('@/services/monthlyIncome.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

function setData(data)  { _result = { data, error: null }; }
function setError(msg)  { _result = { data: null, error: new Error(msg) }; }

const USER = 'user-test-001';

// ── getMonthlyIncome ──────────────────────────────────────────────────────────

describe('getMonthlyIncome', () => {
  beforeEach(() => { vi.clearAllMocks(); _result = { data: null, error: null }; });

  it('retorna el amount del registro existente', async () => {
    setData({ amount_cents: 150000 });

    const result = await monthlyIncomeService.getMonthlyIncome(USER, '2025-03');

    expect(result).toBe(150000);
  });

  it('retorna 0 si el mes no tiene registro (data null)', async () => {
    setData(null);

    const result = await monthlyIncomeService.getMonthlyIncome(USER, '2025-03');

    expect(result).toBe(0);
  });

  it('retorna 0 si amount_cents es null', async () => {
    setData({ amount_cents: null });

    const result = await monthlyIncomeService.getMonthlyIncome(USER, '2025-03');

    expect(result).toBe(0);
  });

  it('retorna 0 para month inválido sin llamar a Supabase', async () => {
    const result = await monthlyIncomeService.getMonthlyIncome(USER, 'invalid');

    expect(result).toBe(0);
    expect(chain.select).not.toHaveBeenCalled();
  });

  it('lanza error si Supabase falla', async () => {
    setError('DB error');

    await expect(monthlyIncomeService.getMonthlyIncome(USER, '2025-03'))
      .rejects.toThrow('DB error');
  });

  it('nunca retorna NaN', async () => {
    setData({ amount_cents: NaN });

    const result = await monthlyIncomeService.getMonthlyIncome(USER, '2025-03');

    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(0);
  });

  it('filtra por el año y mes correctos al parsear YYYY-MM', async () => {
    setData({ amount_cents: 80000 });

    await monthlyIncomeService.getMonthlyIncome(USER, '2024-11');

    const eqCalls = chain.eq.mock.calls;
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ['year',  2024],
        ['month', 11],
      ])
    );
  });
});

// ── upsertMonthlyIncome ───────────────────────────────────────────────────────

describe('upsertMonthlyIncome', () => {
  beforeEach(() => { vi.clearAllMocks(); _result = { data: null, error: null }; });

  it('retorna el amount guardado', async () => {
    const result = await monthlyIncomeService.upsertMonthlyIncome(USER, '2025-03', 120000);

    expect(result).toBe(120000);
  });

  it('redondea amount a 2 decimales antes de guardar', async () => {
    const result = await monthlyIncomeService.upsertMonthlyIncome(USER, '2025-03', 100.555);

    // 100.555 → Math.round(100.555 * 100) / 100 = 100.56
    expect(result).toBe(100.56);
  });

  it('convierte amount inválido (NaN) a 0 sin lanzar error', async () => {
    const result = await monthlyIncomeService.upsertMonthlyIncome(USER, '2025-03', NaN);

    expect(result).toBe(0);
  });

  it('convierte amount negativo a 0', async () => {
    const result = await monthlyIncomeService.upsertMonthlyIncome(USER, '2025-03', -5000);

    expect(result).toBe(0);
  });

  it('convierte null a 0', async () => {
    const result = await monthlyIncomeService.upsertMonthlyIncome(USER, '2025-03', null);

    expect(result).toBe(0);
  });

  it('lanza error para month inválido', async () => {
    await expect(monthlyIncomeService.upsertMonthlyIncome(USER, '2025-13', 1000))
      .rejects.toThrow('Invalid month format');
  });

  it('llama upsert con año y mes correctos', async () => {
    await monthlyIncomeService.upsertMonthlyIncome(USER, '2024-06', 75000);

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, month: 6, amount_cents: 75000 }),
      expect.objectContaining({ onConflict: 'user_id,year,month,currency' })
    );
  });

  it('lanza error si Supabase falla', async () => {
    setError('upsert failed');

    await expect(monthlyIncomeService.upsertMonthlyIncome(USER, '2025-03', 1000))
      .rejects.toThrow('upsert failed');
  });

  it('nunca retorna NaN ni Infinity', async () => {
    const inputs = [NaN, Infinity, -Infinity, null, undefined, '', 'abc'];
    for (const input of inputs) {
      const result = await monthlyIncomeService.upsertMonthlyIncome(USER, '2025-01', input);
      expect(Number.isFinite(result)).toBe(true);
    }
  });
});

// ── getMonthlyIncomeHistory ───────────────────────────────────────────────────

describe('getMonthlyIncomeHistory', () => {
  beforeEach(() => { vi.clearAllMocks(); _result = { data: null, error: null }; });

  it('retorna array vacío cuando no hay registros en la DB', async () => {
    setData([]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    expect(result).toHaveLength(0);
  });

  it('no incluye meses sin registro (no rellena con 0)', async () => {
    const now = new Date();
    setData([{ year: now.getFullYear(), month: now.getMonth() + 1, amount_cents: 50000 }]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(50000);
  });

  it('llena correctamente los meses con datos existentes', async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // mes actual

    setData([{ year, month, amount_cents: 95000 }]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);
    const currentKey = `${year}-${String(month).padStart(2, '0')}`;
    const entry = result.find(r => r.month === currentKey);

    expect(entry).toBeDefined();
    expect(entry.amount).toBe(95000);
  });

  it('solo incluye meses con datos en la DB', async () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const prev = m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };

    setData([
      { year: prev.year, month: prev.month, amount_cents: 80000 },
      { year: y,         month: m,          amount_cents: 100000 },
    ]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    expect(result).toHaveLength(2);
    expect(result.every(r => r.amount > 0)).toBe(true);
  });

  it('retorna los meses ordenados ascendentemente', async () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const prev = m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };

    setData([
      { year: prev.year, month: prev.month, amount_cents: 80000 },
      { year: y,         month: m,          amount_cents: 100000 },
    ]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].month >= result[i - 1].month).toBe(true);
    }
  });

  it('cada entrada tiene las propiedades { month, amount }', async () => {
    const now = new Date();
    setData([{ year: now.getFullYear(), month: now.getMonth() + 1, amount_cents: 60000 }]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    result.forEach(row => {
      expect(row).toHaveProperty('month');
      expect(row).toHaveProperty('amount');
      expect(typeof row.month).toBe('string');
      expect(typeof row.amount).toBe('number');
    });
  });

  it('month tiene formato YYYY-MM', async () => {
    const now = new Date();
    setData([{ year: now.getFullYear(), month: now.getMonth() + 1, amount_cents: 70000 }]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    result.forEach(row => {
      expect(row.month).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it('nunca retorna NaN en amount', async () => {
    setData([
      { year: new Date().getFullYear(), month: new Date().getMonth() + 1, amount_cents: null },
    ]);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    result.forEach(row => {
      expect(Number.isNaN(row.amount)).toBe(false);
    });
  });

  it('lanza error si Supabase falla', async () => {
    setError('query failed');

    await expect(monthlyIncomeService.getMonthlyIncomeHistory(USER))
      .rejects.toThrow('query failed');
  });

  it('retorna array vacío si Supabase devuelve null (sin crash)', async () => {
    setData(null);

    const result = await monthlyIncomeService.getMonthlyIncomeHistory(USER);

    expect(result).toEqual([]);
  });
});
