import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { transactionsService } from '@/services/transactions.service';

export function useDeleteTransaction() {
  const { removeTransaction, removeTransactionGroup } = useStore();
  const [loading, setLoading] = useState(false);

  const remove = async (id, groupId) => {
    setLoading(true);
    try {
      if (groupId) {
        await transactionsService.deleteGroup(groupId);
        removeTransactionGroup(groupId);
      } else {
        await transactionsService.delete(id);
        removeTransaction(id);
      }
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}
