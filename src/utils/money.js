/**
 * Money formatting — integers only, display at render time.
 * All amounts stored as integer (not cents for this project,
 * matching control-g convention where $1,000 = 1000).
 */
export const Mn = {
  fmt(n) {
    if (n == null || isNaN(n)) return '$0';
    return (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('es-AR');
  },

  short(n) {
    const a = Math.abs(Math.round(n || 0));
    const s = (n || 0) < 0 ? '-' : '';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return s + '$' + Math.round(a / 1e3) + 'K';
    return s + '$' + a;
  },

  pct(p, t) {
    return t ? ((p / t) * 100).toFixed(1) + '%' : '0%';
  },
};

/**
 * Convert display amount to integer cents (for DB storage).
 * $150.50 → 15050
 */
export function toCents(displayAmount) {
  if (!displayAmount) return 0;
  const str = String(displayAmount).replace(/[^0-9.\-,]/g, '').replace(',', '.');
  const parts = str.split('.');
  const whole = parseInt(parts[0] || '0', 10);
  const fraction = (parts[1] || '00').padEnd(2, '0').slice(0, 2);
  return whole * 100 + parseInt(fraction, 10) * (whole < 0 ? -1 : 1);
}

/**
 * Convert cents to display string.
 */
export function fromCents(cents, currency = 'ARS') {
  const sym = currency === 'USD' ? 'US$' : '$';
  const amount = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  return sign + sym + ' ' + amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
