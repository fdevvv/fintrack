import { useState, useEffect, useCallback } from 'react';
import { savingsGoalsService } from '@/services/savingsGoals.service';

export function useSavingsGoals() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    savingsGoalsService.list().then(setGoals).catch(() => {});
  }, []);

  const addGoal = useCallback(async ({ name, target, saved, deadline }) => {
    const created = await savingsGoalsService.create({
      name,
      target_amount: Number(target),
      saved_amount: Number(saved) || 0,
      deadline: deadline || null,
    });
    setGoals(g => [...g, created]);
  }, []);

  const updateSaved = useCallback(async (id, saved) => {
    await savingsGoalsService.updateSaved(id, saved);
    setGoals(g => g.map(goal => goal.id === id ? { ...goal, saved_amount: saved } : goal));
  }, []);

  const removeGoal = useCallback(async (id) => {
    await savingsGoalsService.remove(id);
    setGoals(g => g.filter(goal => goal.id !== id));
  }, []);

  return { goals, addGoal, updateSaved, removeGoal };
}
