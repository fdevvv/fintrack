import { describe, it, expect } from 'vitest';
import {
  validateTransaction,
  validateBudget,
  validateCategory,
} from '../src/utils/validation';

describe('validateTransaction', () => {
  const validTx = {
    amount_cents: 15050,
    type: 'expense',
    currency: 'ARS',
    payment_method: 'cash',
    transaction_date: '2025-01-15',
    description: 'Test',
  };

  it('accepts valid transaction', () => {
    const result = validateTransaction({ ...validTx });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing amount', () => {
    const result = validateTransaction({ ...validTx, amount_cents: null });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('monto'))).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = validateTransaction({ ...validTx, amount_cents: -100 });
    expect(result.valid).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = validateTransaction({ ...validTx, amount_cents: 0 });
    expect(result.valid).toBe(false);
  });

  it('rejects float amount', () => {
    const result = validateTransaction({ ...validTx, amount_cents: 150.5 });
    expect(result.valid).toBe(false);
  });

  it('rejects amount exceeding max', () => {
    const result = validateTransaction({ ...validTx, amount_cents: 999_999_999_99 + 1 });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = validateTransaction({ ...validTx, type: 'refund' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid currency', () => {
    const result = validateTransaction({ ...validTx, currency: 'EUR' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid payment method', () => {
    const result = validateTransaction({ ...validTx, payment_method: 'bitcoin' });
    expect(result.valid).toBe(false);
  });

  it('rejects future dates', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = validateTransaction({
      ...validTx,
      transaction_date: future.toISOString().split('T')[0],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects overly long description', () => {
    const result = validateTransaction({
      ...validTx,
      description: 'x'.repeat(501),
    });
    expect(result.valid).toBe(false);
  });

  it('sanitizes HTML in description', () => {
    const data = { ...validTx, description: '<script>alert("xss")</script>Hello' };
    validateTransaction(data);
    expect(data.description).not.toContain('<script>');
  });
});

describe('validateBudget', () => {
  const validBudget = {
    category_id: 'some-uuid',
    limit_cents: 50000,
    currency: 'ARS',
    year: 2025,
    month: 6,
  };

  it('accepts valid budget', () => {
    const result = validateBudget(validBudget);
    expect(result.valid).toBe(true);
  });

  it('rejects missing category', () => {
    const result = validateBudget({ ...validBudget, category_id: null });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid month', () => {
    const result = validateBudget({ ...validBudget, month: 13 });
    expect(result.valid).toBe(false);
  });

  it('rejects year out of range', () => {
    const result = validateBudget({ ...validBudget, year: 2019 });
    expect(result.valid).toBe(false);
  });
});

describe('validateCategory', () => {
  it('accepts valid category', () => {
    const result = validateCategory({ name: 'Comida', type: 'expense' });
    expect(result.valid).toBe(true);
  });

  it('rejects empty name', () => {
    const result = validateCategory({ name: '', type: 'expense' });
    expect(result.valid).toBe(false);
  });

  it('rejects long name', () => {
    const result = validateCategory({ name: 'x'.repeat(51), type: 'expense' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = validateCategory({ name: 'Test', type: 'other' });
    expect(result.valid).toBe(false);
  });
});
