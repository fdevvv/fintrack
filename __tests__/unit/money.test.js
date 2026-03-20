import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  centsToNumber,
  addCents,
  percentOfTotal,
  comparePrices,
} from '../src/utils/money';

describe('toCents', () => {
  it('converts decimal amount to integer cents', () => {
    expect(toCents(150.5)).toBe(15050);
    expect(toCents(0.01)).toBe(1);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(1)).toBe(100);
    expect(toCents(99.99)).toBe(9999);
  });

  it('handles string input (from form fields)', () => {
    expect(toCents('150.50')).toBe(15050);
    expect(toCents('1000')).toBe(100000);
    expect(toCents('0.01')).toBe(1);
  });

  it('handles comma as decimal separator (Argentina locale)', () => {
    expect(toCents('150,50')).toBe(15050);
    expect(toCents('1.500,75')).toBe(150075);
  });

  it('handles null/undefined/empty gracefully', () => {
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toCents('')).toBe(0);
  });

  it('handles zero', () => {
    expect(toCents(0)).toBe(0);
    expect(toCents('0')).toBe(0);
    expect(toCents('0.00')).toBe(0);
  });

  it('truncates beyond 2 decimal places', () => {
    expect(toCents('10.999')).toBe(1099);
    expect(toCents('10.001')).toBe(1000);
  });
});

describe('fromCents', () => {
  it('formats ARS correctly', () => {
    const result = fromCents(15050, 'ARS');
    expect(result).toContain('$');
    expect(result).toContain('150');
  });

  it('formats USD correctly', () => {
    const result = fromCents(15050, 'USD');
    expect(result).toContain('US$');
    expect(result).toContain('150');
  });

  it('handles zero', () => {
    const result = fromCents(0, 'ARS');
    expect(result).toContain('0');
  });

  it('handles negative amounts', () => {
    const result = fromCents(-5000, 'ARS');
    expect(result).toContain('-');
  });

  it('handles large amounts', () => {
    const result = fromCents(99999999, 'ARS');
    expect(result).toContain('999');
  });
});

describe('centsToNumber', () => {
  it('converts cents to decimal number', () => {
    expect(centsToNumber(15050)).toBe(150.5);
    expect(centsToNumber(100)).toBe(1);
    expect(centsToNumber(1)).toBe(0.01);
    expect(centsToNumber(0)).toBe(0);
  });
});

describe('addCents', () => {
  it('adds multiple cent values', () => {
    expect(addCents(1000, 2000, 3000)).toBe(6000);
  });

  it('handles null/undefined values', () => {
    expect(addCents(1000, null, undefined, 2000)).toBe(3000);
  });

  it('handles empty call', () => {
    expect(addCents()).toBe(0);
  });
});

describe('percentOfTotal', () => {
  it('calculates percentage correctly', () => {
    expect(percentOfTotal(25, 100)).toBe(25);
    expect(percentOfTotal(1, 3)).toBeCloseTo(33.33, 1);
    expect(percentOfTotal(50, 200)).toBe(25);
  });

  it('handles division by zero', () => {
    expect(percentOfTotal(100, 0)).toBe(0);
  });

  it('handles zero part', () => {
    expect(percentOfTotal(0, 100)).toBe(0);
  });
});

describe('comparePrices', () => {
  it('detects price increase', () => {
    const result = comparePrices(12000, 10000);
    expect(result.direction).toBe('up');
    expect(result.percentage).toBe(20);
    expect(result.diff).toBe(2000);
  });

  it('detects price decrease', () => {
    const result = comparePrices(8000, 10000);
    expect(result.direction).toBe('down');
    expect(result.percentage).toBe(-20);
    expect(result.diff).toBe(-2000);
  });

  it('detects stable price', () => {
    const result = comparePrices(10000, 10000);
    expect(result.direction).toBe('stable');
    expect(result.percentage).toBe(0);
    expect(result.diff).toBe(0);
  });

  it('handles zero previous price', () => {
    const result = comparePrices(5000, 0);
    expect(result.direction).toBe('stable');
    expect(result.percentage).toBe(0);
  });

  // Edge case: very small changes should show precise percentages
  it('handles small percentage changes', () => {
    const result = comparePrices(10050, 10000);
    expect(result.percentage).toBe(0.5);
  });
});

// Critical: verify that integer arithmetic avoids float precision issues
describe('float precision safety', () => {
  it('never produces float precision errors in arithmetic', () => {
    // The classic float problem: 0.1 + 0.2 !== 0.3
    // With cents: 10 + 20 === 30 (always exact)
    const a = toCents('0.10');
    const b = toCents('0.20');
    expect(a + b).toBe(30); // exactly 30 cents, no float weirdness

    // Another classic: 1.005 rounds incorrectly with floats
    const c = toCents('1.00');
    const d = toCents('0.05');
    expect(addCents(c, d)).toBe(105);
  });

  it('maintains precision through chained operations', () => {
    // Simulate: $100.10 + $200.20 + $300.30 = $600.60
    const total = addCents(
      toCents('100.10'),
      toCents('200.20'),
      toCents('300.30')
    );
    expect(total).toBe(60060);
    expect(centsToNumber(total)).toBe(600.6);
  });
});
