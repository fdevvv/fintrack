/**
 * Tests para useMonthComparison
 *
 * Verifica: estados loading/error/data, retry automático, fallback a ceros.
 * Mocks: analyticsService y useAuth — sin Supabase real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetMonthComparison = vi.fn();

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { getMonthComparison: mockGetMonthComparison },
}));

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Import después de los mocks
const { useMonthComparison } = await import('@/hooks/analytics/useMonthComparison');
const { useAuth }             = await import('@/hooks/auth/useAuth');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID = 'user-abc-123';

const MOCK_DATA = {
  current:  { income: 100000, expenses: 40000, balance: 60000 },
  previous: { income: 80000,  expenses: 35000, balance: 45000 },
  variation: { income: 25, expenses: 14.29, balance: 33.33 },
};

const EMPTY_DATA = {
  current:  { income: 0, expenses: 0, balance: 0 },
  previous: { income: 0, expenses: 0, balance: 0 },
  variation: { income: 0, expenses: 0, balance: 0 },
};

function withSession(id = USER_ID) {
  useAuth.mockReturnValue({ session: { user: { id } } });
}

function withNoSession() {
  useAuth.mockReturnValue({ session: null });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMonthComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Estado inicial ─────────────────────────────────────────────────────────

  it('inicia con loading=true antes de resolver', async () => {
    withSession();
    // Promesa que nunca resuelve → loading queda en true durante el assert
    mockGetMonthComparison.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMonthComparison());

    expect(result.current.loading).toBe(true);
  });

  it('inicia con error=null', async () => {
    withSession();
    mockGetMonthComparison.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMonthComparison());

    expect(result.current.error).toBeNull();
  });

  // ── Carga exitosa ──────────────────────────────────────────────────────────

  it('devuelve data correcta y loading=false al completar', async () => {
    withSession();
    mockGetMonthComparison.mockResolvedValue(MOCK_DATA);

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(MOCK_DATA);
    expect(result.current.error).toBeNull();
  });

  it('llama al servicio con el userId correcto', async () => {
    withSession('test-user-999');
    mockGetMonthComparison.mockResolvedValue(MOCK_DATA);

    renderHook(() => useMonthComparison());

    await waitFor(() => expect(mockGetMonthComparison).toHaveBeenCalledWith('test-user-999'));
  });

  // ── Sin sesión ─────────────────────────────────────────────────────────────

  it('no llama al servicio si no hay sesión', async () => {
    withNoSession();

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetMonthComparison).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(EMPTY_DATA);
  });

  // ── Retry automático ───────────────────────────────────────────────────────

  it('reintenta 1 vez si el primer intento falla y retorna data si el retry tiene éxito', async () => {
    withSession();
    mockGetMonthComparison
      .mockRejectedValueOnce(new Error('timeout'))  // intento 1: falla
      .mockResolvedValueOnce(MOCK_DATA);             // intento 2: ok

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetMonthComparison).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(MOCK_DATA);
    expect(result.current.error).toBeNull();
  });

  it('no hace más de 2 intentos en total', async () => {
    withSession();
    mockGetMonthComparison.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetMonthComparison).toHaveBeenCalledTimes(2);
  });

  // ── Fallback a ceros ───────────────────────────────────────────────────────

  it('retorna EMPTY_DATA si ambos intentos fallan', async () => {
    withSession();
    mockGetMonthComparison.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(EMPTY_DATA);
  });

  it('expone el error si ambos intentos fallan', async () => {
    withSession();
    const err = new Error('DB down');
    mockGetMonthComparison.mockRejectedValue(err);

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('DB down');
  });

  it('loading=false después de fallar (no queda en loading infinito)', async () => {
    withSession();
    mockGetMonthComparison.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loading).toBe(false);
  });

  // ── Estructura de retorno ──────────────────────────────────────────────────

  it('siempre retorna { data, loading, error } con las secciones correctas', async () => {
    withSession();
    mockGetMonthComparison.mockResolvedValue(MOCK_DATA);

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current.data).toHaveProperty('current');
    expect(result.current.data).toHaveProperty('previous');
    expect(result.current.data).toHaveProperty('variation');
  });

  it('data nunca contiene NaN ni Infinity', async () => {
    withSession();
    mockGetMonthComparison.mockResolvedValue(MOCK_DATA);

    const { result } = renderHook(() => useMonthComparison());

    await waitFor(() => expect(result.current.loading).toBe(false));

    for (const section of Object.values(result.current.data)) {
      for (const val of Object.values(section)) {
        expect(Number.isNaN(val)).toBe(false);
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });
});
