import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, MoneyInput } from '@/components/ui/Input';
import { toCents } from '@/utils/money';
import { toISODate } from '@/utils/dates';
import { categoriesService } from '@/services/categories';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'qr_debit', label: 'QR Débito' },
  { value: 'debit_card', label: 'Tarjeta débito' },
  { value: 'credit_card', label: 'Tarjeta crédito' },
];

const DEFAULT_FORM = {
  amount: '',
  type: 'expense',
  currency: 'ARS',
  category_id: '',
  payment_method: 'cash',
  description: '',
  item_name: '',
  transaction_date: toISODate(new Date()),
};

export function TransactionFormModal({ isOpen, onClose, onSubmit, transaction = null }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!transaction;

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (transaction) {
        setForm({
          amount: String((transaction.amount_cents / 100).toFixed(2)),
          type: transaction.type,
          currency: transaction.currency,
          category_id: transaction.category_id || '',
          payment_method: transaction.payment_method,
          description: transaction.description || '',
          item_name: transaction.item_name || '',
          transaction_date: transaction.transaction_date,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setErrors({});
    }
  }, [isOpen, transaction]);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.list();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Ingresá un monto válido';
    }
    if (!form.transaction_date) {
      newErrors.transaction_date = 'La fecha es obligatoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        amount_cents: toCents(form.amount),
        type: form.type,
        currency: form.currency,
        category_id: form.category_id || null,
        payment_method: form.payment_method,
        description: form.description.trim() || null,
        item_name: form.item_name.trim() || null,
        transaction_date: form.transaction_date,
      };

      await onSubmit(payload);
      toast.success(isEditing ? 'Transacción actualizada' : 'Transacción creada');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar transacción' : 'Nueva transacción'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            { value: 'expense', label: 'Gasto', color: 'bg-red-500' },
            { value: 'income', label: 'Ingreso', color: 'bg-emerald-500' },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => update('type')(t.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                form.type === t.value
                  ? `${t.color} text-white shadow-sm`
                  : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <MoneyInput
              label="Monto"
              currency={form.currency}
              value={form.amount}
              onChange={update('amount')}
              error={errors.amount}
            />
          </div>
          <Select label="Moneda" value={form.currency} onChange={update('currency')}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </div>

        {/* Category + Payment */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={update('category_id')}
          >
            <option value="">Sin categoría</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Método de pago"
            value={form.payment_method}
            onChange={update('payment_method')}
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Item name (for price tracking) */}
        <Input
          label="Nombre del item (para seguimiento de precios)"
          value={form.item_name}
          onChange={update('item_name')}
          placeholder="ej: Leche La Serenísima 1L"
        />

        {/* Description */}
        <Input
          label="Descripción"
          value={form.description}
          onChange={update('description')}
          placeholder="Nota opcional"
        />

        {/* Date */}
        <Input
          label="Fecha"
          type="date"
          value={form.transaction_date}
          onChange={update('transaction_date')}
          error={errors.transaction_date}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
