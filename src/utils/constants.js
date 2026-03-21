export const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const SECTIONS = {
  VISA: { label: 'Visa Galicia', color: '#7c6cf0', short: 'Visa' },
  MASTERCARD: { label: 'Mastercard Galicia', color: '#2dd4a8', short: 'MC' },
  OTROS: { label: 'Otros', color: '#f0a848', short: 'Otros' },
  PRESTAMOS: { label: 'Préstamos / Hogar', color: '#f06070', short: 'Prést.' },
};

export const RUBRO_EMOJI = {
  'Ropa': '👕', 'Calzado': '👟', 'Verdulería': '🥬', 'Carnicería': '🥩',
  'Supermercado': '🛒', 'Perfumería': '🧴', 'Delivery': '🛵', 'Suplementos': '💊',
  'Electrodoméstico': '🔌', 'Salidas': '🍻', 'Entradas fiestas': '🎟️',
  'Servicios': '🛡️', 'Otros': '📦', 'Suscripciones': '💳', 'Prestamos': '🏦',
  'Combustible': '⛽',
};

export const DEFAULT_RUBROS = Object.keys(RUBRO_EMOJI);

export const COLORS = [
  '#7c6cf0','#2dd4a8','#f06070','#f0a848','#60a8f0','#e070b0',
  '#a8a0f8','#40d8b0','#f0a080','#70d8d8','#b0b8c8','#707888',
  '#e08060','#20b888','#e060a0','#3088e0',
];

export const SUB_ICONS = {
  NETFLIX: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#000"/><path d="M8 5h2.2l3.8 9V5H16v14h-2.2L10 10v9H8V5z" fill="#E50914"/></svg>',
  SPOTIFY: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#1DB954"/><path d="M8 14.5c2.5-1 5.5-1 8 .5" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M8.5 12c2.2-.8 5-.8 7 .5" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M9 9.5c2-.7 4.5-.7 6 .4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>',
  YOUTUBE: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#FF0000"/><path d="M10 8.5v7l6-3.5z" fill="#fff"/></svg>',
  'APPLE TV': '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#000"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold">TV+</text></svg>',
  PARAMOUNT: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#0064FF"/><path d="M12 5l-1.5 5H8l3 3-1 5 2-3 2 3-1-5 3-3h-2.5z" fill="#fff"/></svg>',
  CLAUDE: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#D4A27F"/><circle cx="12" cy="12" r="5" fill="#fff"/><circle cx="12" cy="12" r="2.5" fill="#D4A27F"/></svg>',
  DISNEY: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#113CCF"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold">D+</text></svg>',
  HBO: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#7B2481"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">MAX</text></svg>',
  AMAZON: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#00A8E1"/><text x="12" y="14.5" text-anchor="middle" fill="#fff" font-size="5.5" font-weight="bold">prime</text></svg>',
  CRUNCHYROLL: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#F47521"/><circle cx="12" cy="12" r="6" fill="#fff"/><circle cx="13" cy="11" r="2.5" fill="#F47521"/></svg>',
};

export const INVESTMENT_OPTIONS = [
  { n: 'Plazo Fijo UVA', r: 'Infl+1-3%', d: 'Ajusta por CER. Mín 90 días.', tag: 'Muy recomendado', tc: '#2dd4a8' },
  { n: 'FCI Money Market', r: 'Variable', d: 'Liquidez 24hs.', tag: 'Esencial', tc: '#7c6cf0' },
  { n: 'Cauciones', r: 'Similar PF', d: 'Garantizados en bolsa.', tag: 'Recomendado', tc: '#60a8f0' },
  { n: 'LECAPs', r: 'Tasa fija', d: 'Bonos cortos gobierno.', tag: 'Recomendado', tc: '#60a8f0' },
  { n: 'Dólar MEP', r: 'Variable', d: 'Dólares vía bolsa.', tag: 'Cobertura', tc: '#f0a848' },
  { n: 'CEDEARs', r: 'Var USD', d: 'Acciones extranjeras en pesos.', tag: 'Muy recomendado', tc: '#2dd4a8' },
  { n: 'Cripto (BTC/ETH)', r: 'Alta vol.', d: 'Solo lo que puedas perder.', tag: 'Solo agresivo', tc: '#f06070' },
];

export function getSubIcon(name) {
  const u = (name || '').toUpperCase();
  for (const [k, svg] of Object.entries(SUB_ICONS)) {
    if (u.includes(k)) return svg;
  }
  return null;
}
