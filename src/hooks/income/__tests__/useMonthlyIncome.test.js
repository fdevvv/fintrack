/**
 * Tests para useMonthlyIncome
 * Cubre: fetch inicial, updateIncome, estados loading/error, fallback a 0.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGet    = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/services/monthlyIncome.service', () => ({
  monthlyIncomeService: {
    getMonthlyIncome:    mockGet,
    upsertMonthlyIncome: mockUpsert,
  },
}));

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

const { useMonthlyIncome } = await import('@/hooks/income/useMonthlyIncome');
const { useAuth }           = await import('@/hooks/auth/useAuth');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID = 'user-income-001';
const MONTH   = '2025-03';

function withSession(id = USER_ID) {
  useAuth.mockReturnValue({ session: { user: { id } } });
}
function withNoSession() {
  useAuth.mockReturnValue({ session: null });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMonthlyIncome — fetch inicial', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna income correcto al cargar', async () => {
    withSession();
    mockGet.mockResolvedValue(120000);

    const { result } = renderHook(() => useMonthlyIncome(MONTH));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.income).toBe(120000);
    expect(result.current.error).toBeNull();
  });

  it('llama getMonthlyIncome con userId y month correctos', async () => {
    withSession();
    mockGet.mockResolvedValue(80000);

    renderHook(() => useMonthlyIncome(MONTH));

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith(USER_ID, MONTH));
  });

  it('income inicia en 0 y loading en true antes de resolver', async () => {
    withSession();
    mockGet.mockReturnValue(new Promise(() => {})); // nunca resuelve

    const { result } = renderHook(() => useMonthlyIncome(MONTH));

    expect(result.current.income).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('fallback a 0 si el servicio retorna null', async () => {
    withSession();
    mockGet.mockResolvedValue(null);

    const { result } = renderHook(() => useMonthlyIncome(MONTH));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.income).toBe(0);
  });

  it('fallback a 0 y expone error si el servicio lanza', async () => {
    withSession();
    mockGet.mockRejectedValue(new Error('fetch failed'));

    const { result } = renderHook(() => useMonthlyIncome(MONTH));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.income).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('fetch failed');
  });

  it('no llama al servicio si no hay sesión', async () => {
    withNoSession();

    const { result } = renderHook(() => useMonthlyIncome(MONTH));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.income).toBe(0);
  });

  it('no llama al servicio si month es undefined', async () => {
    withSession();

    const { result } = renderHook(() => useMonthlyIncome(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('re-fetch cuando cambia el month', async () => {
    withSession();
    mockGet.mockResolvedValue(50000);

    const { result, rerender } = renderHook(({ m }) => useMonthlyIncome(m), {
      initialProps: { m: '2025-02' },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith(USER_ID, '2025-02');

    mockGet.mockResolvedValue(70000);
    rerender({ m: '2025-03' });

    await waitFor(() => expect(result.current.income).toBe(70000));
    expect(mockGet).toHaveBeenCalledWith(USER_ID, '2025-03');
  });
});

describe('useMonthlyIncome — updateIncome', () => {
  beforeEach(() => vi.clearAllMocks());

  it('actualiza income con el valor guardado', async () => {
    withSession();
    mockGet.mockResolvedValue(100000);
    mockUpsert.mockResolvedValue(150000);

    const { result } = renderHook(() => useMonthlyIncome(MONTH));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateIncome(150000);
    });

    expect(result.current.income).toBe(150000);
    expect(result.current.error).toBeNull();
  });

  it('llama upsertMonthlyIncome con userId, month y amount correctos', async () => {
    withSession();
    mockGet.mockResolvedValue(0);
    mockUpsert.mockResolvedValue(90000);

    const { result } = renderHook(() => useMonthlyIncome(MONTH));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateIncome(90000);
    });

    expect(mockUpsert).toHaveBeenCalledWith(USER_ID, MONTH, 90000);
  });

  it('loading=true durante el update, false al terminar', async () => {
    withSession();
    mockGet.mockResolvedValue(0);

    let resolveUpsert;
    mockUpsert.mockReturnValue(new Promise(res => { resolveUpsert = res; }));

    const { result } = renderHook(() => useMonthlyIncome(MONTH));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.updateIncome(50000); });
    expect(result.current.loading).toBe(true);

    await act(async () => { resolveUpsert(50000); });
    expect(result.current.loading).toBe(false);
  });

  it('fallback a 0 y expone error si upsert falla', async () => {
    withSession();
    mockGet.mockResolvedValue(80000);
    mockUpsert.mockRejectedValue(new Error('upsert failed'));

    const { result } = renderHook(() => useMonthlyIncome(MONTH));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateIncome(99999);
    });

    expect(result.current.income).toBe(0);
    expect(result.current.error?.message).toBe('upsert failed');
  });

  it('no hace nada si no hay sesión', async () => {
    withNoSession();

    const { result } = renderHook(() => useMonthlyIncome(MONTH));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateIncome(10000);
    });

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('income nunca es NaN después de update', async () => {
    withSession();
    mockGet.mockResolvedValue(0);
    mockUpsert.mockResolvedValue(null); // servicio devuelve null

    const { result } = renderHook(() => useMonthlyIncome(MONTH));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateIncome(10000);
    });

    expect(Number.isNaN(result.current.income)).toBe(false);
  });
});

describe('useMonthlyIncome — estructura de retorno', () => {
  beforeEach(() => vi.clearAllMocks());

  it('siempre retorna { income, loading, error, updateIncome }', () => {
    withSession();
    mockGet.mockReturnValue(new Promise(() => {})); // nunca resuelve → sin act warning

    const { result } = renderHook(() => useMonthlyIncome(MONTH));

    expect(result.current).toHaveProperty('income');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('updateIncome');
    expect(typeof result.current.updateIncome).toBe('function');
  });
});
