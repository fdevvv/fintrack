import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analytics';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Misc';
import { fromCents, centsToNumber, comparePrices } from '@/utils/money';
import { getCurrentMonth, getPreviousMonths, formatMonthYear } from '@/utils/dates';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function AnalyticsPage() {
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('ARS');

  const { year, month } = getCurrentMonth();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  useEffect(() => {
    loadData();
  }, [currency]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, comp] = await Promise.all([
        analyticsService.getMonthlySummary(6, currency),
        analyticsService.compareMonths(year, month, prevYear, prevMonth, currency),
      ]);
      setMonthlySummary(summary);
      setComparison(comp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const trendData = monthlySummary.map((m) => ({
    month: new Date(m.month).toLocaleDateString('es-AR', { month: 'short' }),
    Ingresos: centsToNumber(m.total_income_cents),
    Gastos: centsToNumber(m.total_expense_cents),
    Balance: centsToNumber(m.balance_cents),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Análisis</h1>
        <div className="flex items-center gap-2">
          {['ARS', 'USD'].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currency === c
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Balance trend */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Tendencia de balance (6 meses)</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v) => fromCents(v * 100, currency)}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Balance" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Month-over-month comparison */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">
            Comparación: {formatMonthYear(year, month)} vs {formatMonthYear(prevYear, prevMonth)}
          </h3>
        </CardHeader>
        <CardContent>
          {comparison.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos para comparar</p>
          ) : (
            <div className="space-y-3">
              {comparison.map((c, i) => {
                const DirIcon =
                  c.direction === 'up' ? TrendingUp : c.direction === 'down' ? TrendingDown : Minus;
                const dirColor =
                  c.direction === 'up' ? 'text-red-500' : c.direction === 'down' ? 'text-emerald-500' : 'text-gray-400';

                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-lg">{c.category_icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {c.category_name || 'Sin categoría'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Anterior: {fromCents(c.previous_total_cents, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {fromCents(c.total_cents, currency)}
                      </p>
                      <div className={`flex items-center gap-1 justify-end ${dirColor}`}>
                        <DirIcon size={12} />
                        <span className="text-xs font-medium">
                          {c.percent_change !== null ? `${c.percent_change > 0 ? '+' : ''}${c.percent_change}%` : 'Nuevo'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category comparison chart */}
      {comparison.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Comparativa por categoría</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={comparison.slice(0, 8).map((c) => ({
                  name: c.category_name || 'Otros',
                  'Mes actual': centsToNumber(c.total_cents),
                  'Mes anterior': centsToNumber(c.previous_total_cents),
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(v) => fromCents(v * 100, currency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="Mes actual" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Mes anterior" fill="#c7d2fe" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
