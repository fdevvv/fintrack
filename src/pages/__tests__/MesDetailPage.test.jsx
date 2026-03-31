import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseMonthDetail = vi.fn();
const mockNavigate       = vi.fn();

vi.mock('@/hooks/analytics/useMonthDetail', () => ({
  useMonthDetail: () => mockUseMonthDetail(),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
vi.mock('@/utils/money',     () => ({ Mn: { fmt: v => `$${v}`, short: v => `$${v}` } }));
vi.mock('@/utils/constants', () => ({
  MONTHS_FULL: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  COLORS: ['#7c6cf0','#2dd4a8'],
  SECTIONS: {
    VISA:       { label: 'Visa',  color: '#7c6cf0', short: 'Visa'  },
    MASTERCARD: { label: 'MC',    color: '#2dd4a8', short: 'MC'    },
    OTROS:      { label: 'Otros', color: '#f0a848', short: 'Otros' },
    PRESTAMOS:  { label: 'Prest', color: '#f06070', short: 'Prést.'},
  },
}));
vi.mock('@/components/ui/Shared', () => ({
  Pnl: ({ title, children }) => <div><div data-testid="pnl-title">{title}</div>{children}</div>,
  ST:  ({ children })         => <div data-testid="section-title">{children}</div>,
}));
vi.mock('@/utils/styles', () => ({
  cardStyle: {}, tooltipStyle: {}, tooltipLabel: {},
  tooltipItem: {}, tooltipWrapper: {}, tooltipCursor: {},
}));
vi.mock('recharts', () => ({
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: () => null, Cell: () => null, Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const { MesDetailPage } = await import('@/pages/MesDetailPage');

const BASE_DATA = {
  ingresoNeto: 1500000,
  totalExpenses: 800000,
  disponible: 700000,
  rubroData: [{ name: 'Ropa', total: 500000 }, { name: 'Servicios', total: 300000 }],
  sectionData: [{ key: 'VISA', label: 'Visa', color: '#7c6cf0', total: 800000 }],
  expenses: [{
    id: '1', type: 'expense', amount_cents: 800000,
    transaction_date: '2026-03-10', section: 'VISA',
    item_name: 'ZARA', categories: { name: 'Ropa' },
    installment_current: 1, installment_total: 3,
  }],
};

describe('MesDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMonthDetail.mockReturnValue(BASE_DATA);
  });

  it('muestra el nombre del mes y año', () => {
    render(<MesDetailPage month="2026-03" />);
    expect(screen.getByTestId('section-title').textContent).toBe('Marzo 2026');
  });

  it('renderiza las 3 cards de resumen', () => {
    render(<MesDetailPage month="2026-03" />);
    expect(screen.getByTestId('card-ingreso')).toBeTruthy();
    expect(screen.getByTestId('card-gastado')).toBeTruthy();
    expect(screen.getByTestId('card-disponible')).toBeTruthy();
  });

  it('muestra el ítem de la lista de transacciones', () => {
    render(<MesDetailPage month="2026-03" />);
    expect(screen.getByText('ZARA')).toBeTruthy();
  });

  it('muestra panel "Por categoría" y "Por sección"', () => {
    render(<MesDetailPage month="2026-03" />);
    const titles = screen.getAllByTestId('pnl-title').map(el => el.textContent);
    expect(titles).toContain('Por categoría');
    expect(titles).toContain('Por sección');
  });

  it('muestra mensaje vacío si no hay gastos', () => {
    mockUseMonthDetail.mockReturnValue({ ...BASE_DATA, expenses: [], rubroData: [], sectionData: [] });
    render(<MesDetailPage month="2026-03" />);
    expect(screen.getByText('Sin gastos en este mes')).toBeTruthy();
  });

  it('botón volver llama a navigate(-1)', () => {
    render(<MesDetailPage month="2026-04" />);
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
