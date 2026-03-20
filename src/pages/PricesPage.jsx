import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner, EmptyState } from '@/components/ui/Misc';
import { Badge } from '@/components/ui/Misc';
import { fromCents, centsToNumber, comparePrices } from '@/utils/money';
import { formatDate } from '@/utils/dates';
import { Search, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function PricesPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('ARS');

  useEffect(() => {
    loadItems();
  }, [currency]);

  const loadItems = async () => {
    try {
      const data = await analyticsService.getTrackedItems('', currency);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectItem = async (itemName) => {
    setSelectedItem(itemName);
    setLoading(true);
    try {
      const history = await analyticsService.getItemPriceHistory(itemName, currency);
      setPriceHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  // Price change analysis
  const firstPrice = priceHistory[0]?.unit_price_cents || 0;
  const lastPrice = priceHistory[priceHistory.length - 1]?.unit_price_cents || 0;
  const priceChange = comparePrices(lastPrice, firstPrice);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento de precios</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Item list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar item..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">
                {items.length === 0
                  ? 'Agregá items en tus transacciones para empezar a trackear precios'
                  : 'Sin resultados'}
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <button
                    key={item}
                    onClick={() => selectItem(item)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                      selectedItem === item ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Price chart */}
        <Card className="lg:col-span-2">
          {!selectedItem ? (
            <EmptyState
              icon={BarChart3}
              title="Seleccioná un item"
              description="Elegí un item de la lista para ver su evolución de precio"
            />
          ) : loading ? (
            <Spinner />
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{selectedItem}</h3>
                  {priceHistory.length >= 2 && (
                    <div className="flex items-center gap-1.5">
                      {priceChange.direction === 'up' ? (
                        <TrendingUp size={14} className="text-red-500" />
                      ) : priceChange.direction === 'down' ? (
                        <TrendingDown size={14} className="text-emerald-500" />
                      ) : (
                        <Minus size={14} className="text-gray-400" />
                      )}
                      <Badge
                        variant={
                          priceChange.direction === 'up'
                            ? 'danger'
                            : priceChange.direction === 'down'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {priceChange.percentage > 0 ? '+' : ''}
                        {priceChange.percentage}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {priceHistory.length < 2 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    Se necesitan al menos 2 registros para mostrar la evolución
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={priceHistory.map((p) => ({
                        date: formatDate(p.recorded_date),
                        Precio: centsToNumber(p.unit_price_cents),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) => fromCents(v * 100, currency)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Precio"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {/* Price history table */}
                {priceHistory.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-2">Historial</p>
                    {priceHistory.slice().reverse().map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5">
                        <span className="text-gray-500">{formatDate(p.recorded_date)}</span>
                        <span className="font-mono font-medium text-gray-900">
                          {fromCents(p.unit_price_cents, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
