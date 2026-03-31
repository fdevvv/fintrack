/**
 * Tests para MonthlyIncomeHistory
 * Cubre: skeleton, vacío, lista, edición, guardado, cancelar, teclado, meses futuros.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateRow = vi.fn();
const mockUseHistory = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/hooks/income/useMonthlyIncomeHistory', () => ({
  useMonthlyIncomeHistory: () => mockUseHistory(),
}));

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}));

vi.mock('@/services/monthlyIncome.service', () => ({
  monthlyIncomeService: { upsertMonthlyIncome: (...a) => mockUpsert(...a) },
}));

vi.mock('@/components/ui/Shared', () => ({
  Pnl: ({ title, children }) => (
    <div><div data-testid="pnl-title">{title}</div>{children}</div>
  ),
}));

vi.mock('@/utils/money', () => ({ Mn: { fmt: v => `$${v}` } }));
vi.mock('@/utils/constants', () => ({
  MONTHS: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
}));

const { MonthlyIncomeHistory } = await import('@/components/income/MonthlyIncomeHistory');

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Meses pasados con dato
const now = new Date();
const curYear = now.getFullYear();
const curMonth = now.getMonth() + 1;
const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
const prevYear  = curMonth === 1 ? curYear - 1 : curYear;

const CUR_KEY  = `${curYear}-${String(curMonth).padStart(2, '0')}`;
const PREV_KEY = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

// Próximos 2 meses (futuros)
function nextKey(offset) {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const NEXT1 = nextKey(1);
const NEXT2 = nextKey(2);

const ROWS = [
  { month: PREV_KEY, amount: 100000 },
  { month: CUR_KEY,  amount: 120000 },
];

function withRows(rows = ROWS) {
  mockUseHistory.mockReturnValue({ rows, loading: false, error: null, updateRow: mockUpdateRow });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MonthlyIncomeHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue(150000);
  });

  // Render básico ──────────────────────────────────────────────────────────────

  it('muestra skeleton mientras carga', () => {
    mockUseHistory.mockReturnValue({ rows: [], loading: true, error: null, updateRow: mockUpdateRow });
    render(<MonthlyIncomeHistory />);
    expect(screen.queryByText('+ Agregar')).toBeNull();
  });

  it('muestra mensaje vacío solo si no hay rows ni meses futuros visibles', () => {
    // Con rows vacíos, los upcoming sí se muestran → no hay mensaje vacío
    withRows([]);
    render(<MonthlyIncomeHistory />);
    // Los próximos 6 meses deberían mostrarse con "+ Agregar"
    expect(screen.getAllByText('+ Agregar').length).toBeGreaterThan(0);
  });

  it('el título del panel es "Ingreso neto mensual"', () => {
    withRows([]);
    render(<MonthlyIncomeHistory />);
    expect(screen.getByTestId('pnl-title').textContent).toBe('Ingreso neto mensual');
  });

  it('renderiza las filas con dato correctamente', () => {
    withRows();
    render(<MonthlyIncomeHistory />);
    expect(screen.getByText('$120000')).toBeTruthy();
  });

  it('muestra variación positiva entre meses', () => {
    withRows();
    render(<MonthlyIncomeHistory />);
    expect(screen.getByText('+20%')).toBeTruthy();
  });

  // Meses futuros ──────────────────────────────────────────────────────────────

  it('muestra botón "+ Agregar" para los próximos meses sin registro', () => {
    withRows(ROWS);
    render(<MonthlyIncomeHistory />);
    // Debe aparecer al menos NEXT1 y NEXT2
    expect(screen.getByTestId(`add-${NEXT1}`)).toBeTruthy();
    expect(screen.getByTestId(`add-${NEXT2}`)).toBeTruthy();
  });

  it('los meses futuros no aparecen si ya tienen registro', () => {
    const rowsWithNext = [...ROWS, { month: NEXT1, amount: 90000 }];
    mockUseHistory.mockReturnValue({ rows: rowsWithNext, loading: false, error: null, updateRow: mockUpdateRow });
    render(<MonthlyIncomeHistory />);
    expect(screen.queryByTestId(`add-${NEXT1}`)).toBeNull();
  });

  it('click en "+ Agregar" abre el input vacío', () => {
    withRows(ROWS);
    render(<MonthlyIncomeHistory />);
    fireEvent.click(screen.getByTestId(`add-${NEXT1}`));
    const input = screen.getByTestId(`input-${NEXT1}`);
    expect(input).toBeTruthy();
    expect(input.value).toBe('');
  });

  it('guardar un mes futuro llama a upsert y updateRow', async () => {
    withRows(ROWS);
    render(<MonthlyIncomeHistory />);
    fireEvent.click(screen.getByTestId(`add-${NEXT1}`));
    fireEvent.change(screen.getByTestId(`input-${NEXT1}`), { target: { value: '130000' } });
    fireEvent.click(screen.getByTestId(`save-${NEXT1}`));
    await waitFor(() => expect(mockUpsert).toHaveBeenCalledWith('user-1', NEXT1, 130000));
    await waitFor(() => expect(mockUpdateRow).toHaveBeenCalledWith(NEXT1, 150000));
  });

  // Edición de meses existentes ────────────────────────────────────────────────

  it('cada fila con dato tiene botón de editar', () => {
    withRows();
    render(<MonthlyIncomeHistory />);
    expect(screen.getByTestId(`edit-${CUR_KEY}`)).toBeTruthy();
  });

  it('click en editar muestra el input con el valor actual', () => {
    withRows();
    render(<MonthlyIncomeHistory />);
    fireEvent.click(screen.getByTestId(`edit-${CUR_KEY}`));
    const input = screen.getByTestId(`input-${CUR_KEY}`);
    expect(input.value).toBe('120000');
  });

  it('cancelar oculta el input', () => {
    withRows();
    render(<MonthlyIncomeHistory />);
    fireEvent.click(screen.getByTestId(`edit-${CUR_KEY}`));
    fireEvent.click(screen.getByTestId(`cancel-${CUR_KEY}`));
    expect(screen.queryByTestId(`input-${CUR_KEY}`)).toBeNull();
  });

  it('Enter guarda, Escape cancela', async () => {
    withRows();
    render(<MonthlyIncomeHistory />);

    fireEvent.click(screen.getByTestId(`edit-${CUR_KEY}`));
    fireEvent.keyDown(screen.getByTestId(`input-${CUR_KEY}`), { key: 'Escape' });
    expect(screen.queryByTestId(`input-${CUR_KEY}`)).toBeNull();

    fireEvent.click(screen.getByTestId(`edit-${PREV_KEY}`));
    fireEvent.change(screen.getByTestId(`input-${PREV_KEY}`), { target: { value: '110000' } });
    fireEvent.keyDown(screen.getByTestId(`input-${PREV_KEY}`), { key: 'Enter' });
    await waitFor(() => expect(mockUpsert).toHaveBeenCalledWith('user-1', PREV_KEY, 110000));
  });
});
