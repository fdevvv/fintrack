import { useEffect, useState } from 'react';
import { useTransactionsStore } from '@/stores/transactionsStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge, Spinner, EmptyState } from '@/components/ui/Misc';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { fromCents } from '@/utils/money';
import { formatDate, getCurrentMonth, getMonthRange } from '@/utils/dates';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Receipt,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  qr_debit: 'QR Débito',
  credit_card: 'Crédito',
  debit_card: 'Débito',
};

export function TransactionsPage() {
  const {
    transactions,
    pagination,
    loading,
    filters,
    setFilters,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setPage,
  } = useTransactionsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCreate = async (data) => {
    await createTransaction(data);
  };

  const handleUpdate = async (data) => {
    if (!editingTx) return;
    await updateTransaction(editingTx.id, data);
    setEditingTx(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta transacción?')) return;
    try {
      await deleteTransaction(id);
      toast.success('Transacción eliminada');
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Nueva
        </Button>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descripción o item..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          icon={Filter}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtros
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Desde"
                type="date"
                value={filters.start}
                onChange={(e) => setFilters({ start: e.target.value })}
              />
              <Input
                label="Hasta"
                type="date"
                value={filters.end}
                onChange={(e) => setFilters({ end: e.target.value })}
              />
              <Select
                label="Tipo"
                value={filters.type || ''}
                onChange={(e) => setFilters({ type: e.target.value || null })}
              >
                <option value="">Todos</option>
                <option value="expense">Gastos</option>
                <option value="income">Ingresos</option>
              </Select>
              <Select
                label="Método"
                value={filters.paymentMethod || ''}
                onChange={(e) => setFilters({ paymentMethod: e.target.value || null })}
              >
                <option value="">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="qr_debit">QR Débito</option>
                <option value="debit_card">Débito</option>
                <option value="credit_card">Crédito</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction list */}
      {loading ? (
        <Spinner />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin transacciones"
          description="Empezá agregando tu primer gasto o ingreso"
          action={
            <Button icon={Plus} onClick={() => setShowForm(true)} size="sm">
              Agregar
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-gray-50/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}
                >
                  {tx.categories?.icon ? (
                    <span className="text-base">{tx.categories.icon}</span>
                  ) : tx.type === 'income' ? (
                    <ArrowUpRight size={16} className="text-emerald-600" />
                  ) : (
                    <ArrowDownRight size={16} className="text-red-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.item_name || tx.description || tx.categories?.name || 'Sin descripción'}
                    </p>
                    <Badge variant="default">
                      {PAYMENT_LABELS[tx.payment_method] || tx.payment_method}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(tx.transaction_date)}
                    {tx.categories?.name && ` · ${tx.categories.name}`}
                  </p>
                </div>

                {/* Amount */}
                <p
                  className={`text-sm font-semibold font-mono whitespace-nowrap ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {fromCents(tx.amount_cents, tx.currency)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingTx(tx);
                      setShowForm(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-500">
                {pagination.total} transacciones
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(pagination.page - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-600 px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(pagination.page + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Form modal */}
      <TransactionFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTx(null);
        }}
        onSubmit={editingTx ? handleUpdate : handleCreate}
        transaction={editingTx}
      />
    </div>
  );
}
