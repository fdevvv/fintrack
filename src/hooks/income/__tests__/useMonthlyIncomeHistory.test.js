/**
 * Tests para useMonthlyIncomeHistory
 * Cubre: fetch, estados, fallback, sin sesión.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetHistory = vi.fn();

vi.mock('@/services/monthlyIncome.service', () => ({
  monthlyIncomeService: { getMonthlyIncomeHistory: mockGetHistory },
}));

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

const { useMonthlyIncomeHistory } = await import('@/hooks/income/useMonthlyIncomeHistory');
const { useAuth }                  = await import('@/hooks/auth/useAuth');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID = 'user-hist-001';

const MOCK_ROWS = [
  { month: '2025-01', amount: 100000 },
  { month: '2025-02', amount: 120000 },
  { month: '2025-03', amount: 110000 },
];

function withSession() { useAuth.mockReturnValue({ session: { user: { id: USER_ID } } }); }
function withNoSession() { useAuth.mockReturnValue({ session: null }); }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMonthlyIncomeHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna rows correctas al cargar', async () => {
    withSession();
    mockGetHistory.mockResolvedValue(MOCK_ROWS);

    const { result } = renderHook(() => useMonthlyIncomeHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows).toEqual(MOCK_ROWS);
    expect(result.current.error).toBeNull();
  });

  it('llama al servicio con el userId correcto', async () => {
    withSession();
    mockGetHistory.mockResolvedValue([]);

    renderHook(() => useMonthlyIncomeHistory());

    await waitFor(() => expect(mockGetHistory).toHaveBeenCalledWith(USER_ID));
  });

  it('rows inicia vacío y loading en true', async () => {
    withSession();
    mockGetHistory.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMonthlyIncomeHistory());

    expect(result.current.rows).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('no llama al servicio sin sesión', async () => {
    withNoSession();

    const { result } = renderHook(() => useMonthlyIncomeHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetHistory).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
  });

  it('fallback a [] y expone error si el servicio falla', async () => {
    withSession();
    mockGetHistory.mockRejectedValue(new Error('history fetch failed'));

    const { result } = renderHook(() => useMonthlyIncomeHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows).toEqual([]);
    expect(result.current.error?.message).toBe('history fetch failed');
  });

  it('fallback a [] si el servicio retorna null', async () => {
    withSession();
    mockGetHistory.mockResolvedValue(null);

    const { result } = renderHook(() => useMonthlyIncomeHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows).toEqual([]);
  });

  it('loading siempre llega a false (no queda colgado)', async () => {
    withSession();
    mockGetHistory.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useMonthlyIncomeHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('updateRow actualiza el amount del mes correcto sin tocar los demás', async () => {
    withSession();
    mockGetHistory.mockResolvedValue([
      { month: '2026-01', amount: 100000 },
      { month: '2026-02', amount: 120000 },
    ]);

    const { result } = renderHook(() => useMonthlyIncomeHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.updateRow('2026-01', 150000));

    expect(result.current.rows.find(r => r.month === '2026-01').amount).toBe(150000);
    expect(result.current.rows.find(r => r.month === '2026-02').amount).toBe(120000);
  });

  it('updateRow inserta un mes nuevo en orden ascendente', async () => {
    withSession();
    mockGetHistory.mockResolvedValue([
      { month: '2026-01', amount: 100000 },
      { month: '2026-03', amount: 120000 },
    ]);

    const { result } = renderHook(() => useMonthlyIncomeHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.updateRow('2026-02', 110000));

    expect(result.current.rows).toHaveLength(3);
    expect(result.current.rows[1]).toEqual({ month: '2026-02', amount: 110000 });
  });
});
