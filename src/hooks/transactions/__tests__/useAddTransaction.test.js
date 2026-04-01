/**
 * Tests para useAddTransaction
 *
 * Verifica: división correcta por cuotas, monto en pesos y dólares,
 * generación de rows, campos installment_current / installment_total.
 * Mocks: transactionsService, dolarService, useStore — sin Supabase real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockInsertMany = vi.fn();
const mockGetMepRate = vi.fn();

vi.mock('@/services/transactions.service', () => ({
  transactionsService: { insertMany: mockInsertMany },
}));

vi.mock('@/services/dolar.service', () => ({
  dolarService: { getMepRate: mockGetMepRate },
}));

vi.mock('@/stores/useStore', () => ({
  useStore: vi.fn(),
}));

const { useAddTransaction } = await import('@/hooks/transactions/useAddTransaction');
const { useStore }          = await import('@/stores/useStore');

// ── Helpers ───────────────────────────────────────────────────────────────────

function withStore(year = 2026) {
  useStore.mockReturnValue({ year, appendTransactions: vi.fn() });
}

function basePayload(overrides = {}) {
  return {
    item_name: 'Notebook',
    category_id: 'cat-1',
    section: 'TECNOLOGIA',
    amount: 90000,
    cuotas: 3,
    start_month: 1,
    currency: 'ARS',
    payment_method: 'credit_card',
    destino: 'tarjeta',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAddTransaction — división de cuotas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withStore();
    mockInsertMany.mockResolvedValue([]);
  });

  it('divide el monto total en partes iguales por cuota', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({ amount: 90000, cuotas: 3 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    // Cada cuota debe ser 30000, no 90000
    rows.forEach(row => {
      expect(row.amount_cents).toBe(30000);
    });
  });

  it('crea exactamente N rows según el número de cuotas', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({ cuotas: 6, start_month: 1 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    expect(rows).toHaveLength(6);
  });

  it('asigna installment_current y installment_total correctamente', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({ cuotas: 3 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    expect(rows[0].installment_current).toBe(1);
    expect(rows[1].installment_current).toBe(2);
    expect(rows[2].installment_current).toBe(3);
    rows.forEach(row => expect(row.installment_total).toBe(3));
  });

  it('todas las cuotas comparten el mismo installment_group_id', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({ cuotas: 4 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    const groupId = rows[0].installment_group_id;
    expect(groupId).toBeTruthy();
    rows.forEach(row => expect(row.installment_group_id).toBe(groupId));
  });

  it('no divide el monto cuando destino=manual (1 sola fila)', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({
        destino: 'manual',
        cuotas: 3,
        amount: 90000,
      }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].amount_cents).toBe(90000);
  });

  it('con 1 cuota el monto se mantiene completo', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({ cuotas: 1, amount: 50000 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].amount_cents).toBe(50000);
  });

  it('redondea correctamente cuando el monto no divide exacto', async () => {
    const { result } = renderHook(() => useAddTransaction());

    // 100 / 3 = 33.33... → Math.round → 33
    await act(async () => {
      await result.current.add(basePayload({ amount: 100, cuotas: 3 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    rows.forEach(row => {
      expect(row.amount_cents).toBe(33);
    });
  });

  it('asigna fechas progresivas una por mes', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({ cuotas: 3, start_month: 4 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    expect(rows[0].transaction_date).toBe('2026-04-15');
    expect(rows[1].transaction_date).toBe('2026-05-15');
    expect(rows[2].transaction_date).toBe('2026-06-15');
  });

  it('cuotas que superan diciembre se registran en el año siguiente', async () => {
    const { result } = renderHook(() => useAddTransaction());

    // 6 cuotas desde noviembre → nov, dic (año actual) + ene, feb, mar, abr (año siguiente)
    await act(async () => {
      await result.current.add(basePayload({ cuotas: 6, start_month: 11 }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    expect(rows).toHaveLength(6);
    expect(rows[0].transaction_date).toBe('2026-11-15');
    expect(rows[0].year).toBe(2026);
    expect(rows[1].transaction_date).toBe('2026-12-15');
    expect(rows[1].year).toBe(2026);
    expect(rows[2].transaction_date).toBe('2027-01-15');
    expect(rows[2].year).toBe(2027);
    expect(rows[3].transaction_date).toBe('2027-02-15');
    expect(rows[4].transaction_date).toBe('2027-03-15');
    expect(rows[5].transaction_date).toBe('2027-04-15');
  });
});

describe('useAddTransaction — monto en USD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withStore();
    mockInsertMany.mockResolvedValue([]);
    mockGetMepRate.mockResolvedValue(1200);
  });

  it('convierte USD a ARS usando la cotización MEP y divide por cuotas', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({
        amount: 300,        // USD
        cuotas: 3,
        currency: 'USD',
      }));
    });

    // 300 USD × 1200 = 360000 ARS → 360000 / 3 = 120000 por cuota
    const rows = mockInsertMany.mock.calls[0][0];
    rows.forEach(row => {
      expect(row.amount_cents).toBe(120000);
    });
  });

  it('guarda usd_amount y usd_rate en cada cuota', async () => {
    const { result } = renderHook(() => useAddTransaction());

    await act(async () => {
      await result.current.add(basePayload({
        amount: 100,
        cuotas: 2,
        currency: 'USD',
      }));
    });

    const rows = mockInsertMany.mock.calls[0][0];
    rows.forEach(row => {
      expect(row.usd_amount).toBe(100);
      expect(row.usd_rate).toBe(1200);
    });
  });
});
