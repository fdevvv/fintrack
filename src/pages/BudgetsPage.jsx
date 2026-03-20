import { useEffect, useState } from 'react';
import { budgetsService } from '@/services/budgets';
import { categoriesService } from '@/services/categories';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, MoneyInput } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, Spinner, EmptyState } from '@/components/ui/Misc';
import { fromCents, toCents } from '@/utils/money';
import { getCurrentMonth, formatMonthYear } from '@/utils/dates';
import { Target, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currency, setCurrency] = useState('ARS');
  const { year, month } = getCurrentMonth();

  const [form, setForm] = useState({
    category_id: '',
    limit: '',
    currency: 'ARS',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        budgetsService.getWithSpending(year, month, currency),
        categoriesService.list('expense'),
      ]);
      setBudgets(b);
      setCategories(c);
    } catch (err) {
      toast.error('Error cargando presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currency]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await budgetsService.upsert({
        category_id: form.category_id,
        limit_cents: toCents(form.limit),
        currency: form.currency,
        year,
        month,
      });
      toast.success('Presupuesto guardado');
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      await budgetsService.delete(id);
      toast.success('Presupuesto eliminado');
      loadData();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  // Categories that don't have a budget yet
  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatMonthYear(year, month)}</p>
        </div>
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
          <Button icon={Plus} onClick={() => setShowForm(true)} size="sm">
            Agregar
          </Button>
        </div>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin presupuestos"
          description="Definí límites de gasto por categoría para este mes"
          action={
            <Button icon={Plus} onClick={() => setShowForm(true)} size="sm">
              Crear presupuesto
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const percent = Math.min(b.percent_used, 100);
            const barColor = b.is_over_budget
              ? 'bg-red-500'
              : b.percent_used >= 80
              ? 'bg-amber-500'
              : 'bg-brand-500';

            return (
              <Card key={b.id}>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{b.categories?.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {b.categories?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {b.transaction_count} transacciones
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.is_over_budget && (
                        <Badge variant="danger">Excedido</Badge>
                      )}
                      {b.percent_used >= 80 && !b.is_over_budget && (
                        <Badge variant="warning">Atención</Badge>
                      )}
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Gastado: <span className="font-semibold text-gray-700">{fromCents(b.spent_cents, currency)}</span>
                    </span>
                    <span className="text-gray-500">
                      Límite: <span className="font-semibold text-gray-700">{fromCents(b.limit_cents, currency)}</span>
                    </span>
                  </div>

                  {b.remaining_cents > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Restante: {fromCents(b.remaining_cents, currency)}
                    </p>
                  )}
                  {b.remaining_cents < 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Excedido por: {fromCents(Math.abs(b.remaining_cents), currency)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Budget form modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo presupuesto">
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            required
          >
            <option value="">Seleccionar...</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>

          <MoneyInput
            label="Límite mensual"
            currency={form.currency}
            value={form.limit}
            onChange={(v) => setForm((f) => ({ ...f, limit: v }))}
          />

          <Select
            label="Moneda"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
