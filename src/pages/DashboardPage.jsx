import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Misc';
import { Spinner } from '@/components/ui/Misc';
import { fromCents, centsToNumber } from '@/utils/money';
import { formatMonthYear } from '@/utils/dates';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  qr_debit: 'QR Débito',
  credit_card: 'Tarjeta crédito',
  debit_card: 'Tarjeta débito',
};

export function DashboardPage() {
  const { data, loading, selectedCurrency, selectedPeriod, setCurrency, fetchDashboard } =
    useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [selectedCurrency, selectedPeriod]);

  if (loading && !data) return <Spinner />;

  const { currentMonth, categoryBreakdown, paymentBreakdown, alerts, monthlySummary } =
    data || {};

  const income = currentMonth?.total_income_cents || 0;
  const expenses = currentMonth?.total_expense_cents || 0;
  const balance = currentMonth?.balance_cents || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatMonthYear(selectedPeriod.year, selectedPeriod.month)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ARS', 'USD'].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCurrency === c
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Ingresos"
          amount={income}
          currency={selectedCurrency}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <SummaryCard
          title="Gastos"
          amount={expenses}
          currency={selectedCurrency}
          icon={TrendingDown}
          color="text-red-600"
          bg="bg-red-50"
        />
        <SummaryCard
          title="Balance"
          amount={balance}
          currency={selectedCurrency}
          icon={Wallet}
          color={balance >= 0 ? 'text-emerald-600' : 'text-red-600'}
          bg={balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
        />
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Alertas
            </h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  alert.severity === 'danger'
                    ? 'bg-red-50'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50'
                    : 'bg-blue-50'
                }`}
              >
                <span className="text-lg">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  {alert.details?.over_by_cents && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Excedido por {fromCents(alert.details.over_by_cents, selectedCurrency)}
                    </p>
                  )}
                </div>
                <Badge variant={alert.severity}>
                  {alert.severity === 'danger' ? 'Excedido' : alert.severity === 'warning' ? 'Atención' : 'Info'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Evolución mensual</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(monthlySummary || []).map((m) => ({
                month: new Date(m.month).toLocaleDateString('es-AR', { month: 'short' }),
                Ingresos: centsToNumber(m.total_income_cents),
                Gastos: centsToNumber(m.total_expense_cents),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => fromCents(v * 100, selectedCurrency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="Ingresos" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Gastos por categoría</h3>
          </CardHeader>
          <CardContent>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown.map((c) => ({
                      name: c.category_name || 'Sin categoría',
                      value: centsToNumber(c.total_cents),
                      color: c.category_color,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {categoryBreakdown.map((c, i) => (
                      <Cell key={i} fill={c.category_color || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => fromCents(v * 100, selectedCurrency)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">Sin gastos este mes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment method breakdown */}
      {paymentBreakdown && Object.keys(paymentBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Por método de pago</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(paymentBreakdown).map(([method, info]) => (
                <div key={method} className="p-3 rounded-xl bg-gray-50 text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    {PAYMENT_LABELS[method] || method}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {fromCents(info.total_cents, selectedCurrency)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {info.count} transacciones
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ title, amount, currency, icon: Icon, color, bg }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className={`text-xl font-bold ${color}`}>
            {fromCents(amount, currency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
