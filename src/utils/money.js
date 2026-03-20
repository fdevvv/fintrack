/**
 * Money utilities — all monetary operations use integer cents.
 * 
 * WHY: JavaScript floats cause precision errors with money.
 *   0.1 + 0.2 = 0.30000000000000004
 *   Using integer cents: 10 + 20 = 30 (always exact)
 * 
 * RULE: amount_cents is ALWAYS a BigInt-safe integer.
 * Display conversion happens ONLY at render time.
 */

const CURRENCY_CONFIG = {
  ARS: {
    symbol: '$',
    code: 'ARS',
    locale: 'es-AR',
    decimals: 2,
    thousandsSep: '.',
    decimalSep: ',',
  },
  USD: {
    symbol: 'US$',
    code: 'USD',
    locale: 'en-US',
    decimals: 2,
    thousandsSep: ',',
    decimalSep: '.',
  },
};

/**
 * Convert a display amount (e.g., 150.50) to integer cents (15050).
 * Handles string input safely to avoid float precision issues.
 */
export function toCents(displayAmount) {
  if (displayAmount === null || displayAmount === undefined || displayAmount === '') {
    return 0;
  }

  // If it's already an integer (cents), return as-is
  if (typeof displayAmount === 'number' && Number.isInteger(displayAmount) && displayAmount > 999) {
    return displayAmount;
  }

  // Convert through string to avoid float math
  const str = String(displayAmount).replace(/[^0-9.\-,]/g, '').replace(',', '.');
  const parts = str.split('.');
  const whole = parseInt(parts[0] || '0', 10);
  const fraction = (parts[1] || '00').padEnd(2, '0').slice(0, 2);

  return whole * 100 + parseInt(fraction, 10) * (whole < 0 ? -1 : 1);
}

/**
 * Convert integer cents to display amount.
 * 15050 → "15.050,50" (ARS) or "15,050.50" (USD)
 */
export function fromCents(cents, currency = 'ARS') {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.ARS;
  const amount = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);

  return `${sign}${config.symbol} ${formatted}`;
}

/**
 * Raw number from cents (for calculations/charts).
 * 15050 → 150.50
 */
export function centsToNumber(cents) {
  return cents / 100;
}

/**
 * Safe addition of multiple cent values.
 */
export function addCents(...values) {
  return values.reduce((sum, v) => sum + (v || 0), 0);
}

/**
 * Calculate percentage of total, safe from division by zero.
 */
export function percentOfTotal(part, total) {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100; // 2 decimal precision
}

/**
 * Compare two cent amounts and return the difference + direction.
 */
export function comparePrices(currentCents, previousCents) {
  if (previousCents === 0) return { diff: 0, percentage: 0, direction: 'stable' };

  const diff = currentCents - previousCents;
  const percentage = Math.round((diff / previousCents) * 10000) / 100;

  return {
    diff,
    percentage,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
  };
}

export { CURRENCY_CONFIG };
