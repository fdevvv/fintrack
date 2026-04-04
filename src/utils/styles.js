/** Reusable dark mode style objects — Slate Finance design system */

export const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(255,255,255,0.05)',
  color: '#e2e8f0',
  fontSize: 16,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
};

export const cardStyle = {
  background: '#111219',
  borderRadius: 12,
  padding: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
};

export const cardStyleElevated = {
  background: '#161824',
  borderRadius: 12,
  padding: '16px',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
};

export const tooltipStyle = {
  background: '#1c2030',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  fontSize: 12,
  color: '#e2e8f0',
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

export const tooltipLabel  = { color: '#e2e8f0', fontWeight: 600, marginBottom: 4, fontSize: 12 };
export const tooltipItem   = { color: '#818cf8' };
export const tooltipWrapper = { outline: 'none', zIndex: 10 };
export const tooltipCursor = { fill: 'rgba(255,255,255,0.03)' };

export const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.3px',
  fontFamily: "'Inter', system-ui, sans-serif",
};

export const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.2px',
};

/** Color helpers */
export const C = {
  primary:  '#818cf8',
  success:  '#34d399',
  danger:   '#f87171',
  warning:  '#fbbf24',
  info:     '#60a5fa',
  pink:     '#f472b6',
  text:     '#e2e8f0',
  textSec:  '#94a3b8',
  textMuted:'#64748b',
  bg:       '#09090f',
  bgCard:   '#111219',
  bgSurf:   '#161824',
  bgOver:   '#1c2030',
  border:   'rgba(255,255,255,0.09)',
};
