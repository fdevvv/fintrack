import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/stores/useStore', () => ({ useStore: vi.fn() }));
vi.mock('@/utils/constants', () => ({
  SECTIONS: {
    VISA:       { label: 'Visa',       color: '#7c6cf0', short: 'Visa'   },
    MASTERCARD: { label: 'MC',         color: '#2dd4a8', short: 'MC'     },
    OTROS:      { label: 'Otros',      color: '#f0a848', short: 'Otros'  },
    PRESTAMOS:  { label: 'Préstamos',  color: '#f06070', short: 'Prést.' },
  },
}));

const { useMonthDetail } = await import('@/hooks/analytics/useMonthDetail');
const { useStore }       = await import('@/stores/useStore');

function mockStore(transactions = [], income = new Array(12).fill(0)) {
  useStore.mockReturnValue({ transactions, income });
}

const MARCH_TX = (id, amount, category = 'Ropa', section = 'VISA') => ({
  id, type: 'expense', amount_cents: amount,
  transaction_date: '2026-03-10', section,
  categories: { name: category },
  installment_current: 1, installment_total: 1,
});

describe('useMonthDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna ceros si no hay transacciones en el mes', () => {
    mockStore();
    const { result } = renderHook(() => useMonthDetail('2026-03'));
    expect(result.current.totalExpenses).toBe(0);
    expect(result.current.rubroData).toEqual([]);
    expect(result.current.sectionData).toEqual([]);
  });

  it('suma solo los gastos del mes indicado, ignora otros meses', () => {
    const income = new Array(12).fill(0);
    income[2] = 1500000; // marzo = índice 2
    mockStore([
      MARCH_TX('a', 100000),
      MARCH_TX('b', 50000, 'Servicios', 'MASTERCARD'),
      { id: 'c', type: 'expense', amount_cents: 999999, transaction_date: '2026-04-10', section: 'VISA', categories: { name: 'Ropa' } },
    ], income);

    const { result } = renderHook(() => useMonthDetail('2026-03'));
    expect(result.current.totalExpenses).toBe(150000);
    expect(result.current.ingresoNeto).toBe(1500000);
    expect(result.current.disponible).toBe(1350000);
    expect(result.current.expenses).toHaveLength(2);
  });

  it('agrupa por categoría en rubroData ordenado desc', () => {
    mockStore([
      MARCH_TX('a', 80000, 'Ropa'),
      MARCH_TX('b', 40000, 'Ropa'),
      MARCH_TX('c', 60000, 'Servicios', 'MASTERCARD'),
    ]);
    const { result } = renderHook(() => useMonthDetail('2026-03'));
    expect(result.current.rubroData[0]).toEqual({ name: 'Ropa', total: 120000 });
    expect(result.current.rubroData[1]).toEqual({ name: 'Servicios', total: 60000 });
  });

  it('excluye transacciones de tipo income', () => {
    mockStore([
      { id: 'x', type: 'income', amount_cents: 999999, transaction_date: '2026-03-01', section: 'OTROS', categories: null },
      MARCH_TX('y', 100000),
    ]);
    const { result } = renderHook(() => useMonthDetail('2026-03'));
    expect(result.current.totalExpenses).toBe(100000);
    expect(result.current.expenses).toHaveLength(1);
  });

  it('disponible es negativo cuando gastos superan ingreso', () => {
    const income = new Array(12).fill(0);
    income[2] = 50000;
    mockStore([MARCH_TX('a', 100000)], income);
    const { result } = renderHook(() => useMonthDetail('2026-03'));
    expect(result.current.disponible).toBe(-50000);
  });
});
