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

