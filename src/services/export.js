import { MONTHS, SECTIONS, RUBRO_EMOJI } from '@/utils/constants';
import { Mn } from '@/utils/money';

/**
 * Export transactions to styled Excel file.
 * Uses SheetJS (xlsx) loaded from CDN.
 */
export async function exportToExcel(transactions, income, year) {
  // Load SheetJS from CDN if not already loaded
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;

  const expenses = transactions.filter(t => t.type === 'expense' && !t.deleted_at);
  const wb = XLSX.utils.book_new();

  // ============================================================
  // RESUMEN sheet
  // ============================================================
  const resumenData = buildResumenSheet(expenses, income, year);
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData.rows);
  applyStyles(wsResumen, resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // ============================================================
  // Per-section sheets
  // ============================================================
  Object.entries(SECTIONS).forEach(([secKey, secInfo]) => {
    const secExpenses = expenses.filter(t => (t.section || 'OTROS') === secKey);
    if (!secExpenses.length) return;

    const sheetData = buildSectionSheet(secExpenses, secKey, secInfo, year);
    const ws = XLSX.utils.aoa_to_sheet(sheetData.rows);
    applyStyles(ws, sheetData);
    XLSX.utils.book_append_sheet(wb, ws, secInfo.short);
  });

  // ============================================================
  // Gastos del Mes sheet (manual only)
  // ============================================================
  const manualExpenses = expenses.filter(t => t.source === 'manual');
  if (manualExpenses.length) {
    const gastosData = buildGastosSheet(manualExpenses, year);
    const wsGastos = XLSX.utils.aoa_to_sheet(gastosData.rows);
    applyStyles(wsGastos, gastosData);
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos Mes');
  }

  // Download
  XLSX.writeFile(wb, `FinTrack_${year}.xlsx`);
}

function buildResumenSheet(expenses, income, year) {
  const rows = [];
  const merges = [];
  const boldRows = [];
  const headerRow = 3;

  // Title
  rows.push([`CONTROL DE GASTOS ${year}`]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } });
  rows.push([]);

  // Income row
  rows.push(['', '', '', ...MONTHS.map((m, i) => income[i] || 0)]);
  rows[2][0] = 'INGRESOS';
  boldRows.push(2);

  // Headers
  rows.push(['SECCIÓN', 'ITEM', 'RUBRO', ...MONTHS, 'TOTAL']);
  boldRows.push(headerRow);

  // Group by section
  const sectionTotals = {};
  Object.keys(SECTIONS).forEach(k => { sectionTotals[k] = new Array(12).fill(0); });

  // Group items: unique by item_name + section
  const grouped = {};
  expenses.forEach(t => {
    const key = `${t.item_name || t.description}||${t.section || 'OTROS'}`;
    if (!grouped[key]) {
      grouped[key] = {
        name: t.item_name || t.description || 'Sin nombre',
        rubro: t.categories?.name || 'Otros',
        section: t.section || 'OTROS',
        months: new Array(12).fill(0),
        installments: t.installment_total || 1,
      };
    }
    const mo = new Date(t.transaction_date).getMonth();
    grouped[key].months[mo] += t.amount_cents;
  });

  // Sort by section then rubro
  const items = Object.values(grouped).sort((a, b) => {
    const secOrder = Object.keys(SECTIONS);
    const ai = secOrder.indexOf(a.section), bi = secOrder.indexOf(b.section);
    if (ai !== bi) return ai - bi;
    return a.rubro.localeCompare(b.rubro);
  });

  let lastSec = '';
  items.forEach(item => {
    if (item.section !== lastSec) {
      lastSec = item.section;
    }
    const total = item.months.reduce((s, v) => s + v, 0);
    rows.push([
      SECTIONS[item.section]?.short || item.section,
      item.name,
      item.rubro,
      ...item.months,
      total,
    ]);

    // Accumulate section totals
    if (sectionTotals[item.section]) {
      item.months.forEach((v, i) => { sectionTotals[item.section][i] += v; });
    }
  });

  // Blank row
  rows.push([]);

  // Section subtotals
  Object.entries(SECTIONS).forEach(([key, info]) => {
    const tots = sectionTotals[key] || new Array(12).fill(0);
    const total = tots.reduce((s, v) => s + v, 0);
    if (total > 0) {
      rows.push([info.short, '', 'SUBTOTAL', ...tots, total]);
      boldRows.push(rows.length - 1);
    }
  });

  // Grand total
  const grandTotals = new Array(12).fill(0);
  Object.values(sectionTotals).forEach(tots => {
    tots.forEach((v, i) => { grandTotals[i] += v; });
  });
  rows.push(['', '', 'TOTAL GASTOS', ...grandTotals, grandTotals.reduce((s, v) => s + v, 0)]);
  boldRows.push(rows.length - 1);

  // Balance row
  const balance = MONTHS.map((_, i) => (income[i] || 0) - grandTotals[i]);
  rows.push(['', '', 'BALANCE', ...balance, balance.reduce((s, v) => s + v, 0)]);
  boldRows.push(rows.length - 1);

  return {
    rows,
    merges,
    boldRows,
    headerRow,
    colWidths: [12, 28, 16, ...MONTHS.map(() => 14), 14],
    moneyStartCol: 3,
  };
}

function buildSectionSheet(expenses, secKey, secInfo, year) {
  const rows = [];
  const merges = [];
  const boldRows = [];

  rows.push([`${secInfo.label} — ${year}`]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } });
  rows.push([]);

  rows.push(['ITEM', 'RUBRO', 'CUOTAS', ...MONTHS, 'TOTAL']);
  boldRows.push(2);

  const grouped = {};
  expenses.forEach(t => {
    const key = t.item_name || t.description || 'Sin nombre';
    if (!grouped[key]) {
      grouped[key] = {
        name: key,
        rubro: t.categories?.name || 'Otros',
        cuotas: t.installment_total || 1,
        months: new Array(12).fill(0),
      };
    }
    const mo = new Date(t.transaction_date).getMonth();
    grouped[key].months[mo] += t.amount_cents;
  });

  Object.values(grouped).sort((a, b) => a.rubro.localeCompare(b.rubro)).forEach(item => {
    const total = item.months.reduce((s, v) => s + v, 0);
    rows.push([item.name, item.rubro, item.cuotas, ...item.months, total]);
  });

  // Total row
  rows.push([]);
  const tots = new Array(12).fill(0);
  Object.values(grouped).forEach(item => { item.months.forEach((v, i) => { tots[i] += v; }); });
  rows.push(['', '', 'TOTAL', ...tots, tots.reduce((s, v) => s + v, 0)]);
  boldRows.push(rows.length - 1);

  return {
    rows,
    merges,
    boldRows,
    headerRow: 2,
    colWidths: [28, 16, 8, ...MONTHS.map(() => 14), 14],
    moneyStartCol: 3,
  };
}

function buildGastosSheet(expenses, year) {
  const rows = [];
  const boldRows = [];
  const merges = [];

  rows.push([`GASTOS DEL MES — ${year}`]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
  rows.push([]);

  rows.push(['FECHA', 'ITEM', 'RUBRO', 'MÉTODO', 'MONTO']);
  boldRows.push(2);

  const METHODS = { cash: 'Efectivo', transfer: 'Transferencia', qr_debit: 'QR Débito', debit_card: 'Débito' };

  expenses
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .forEach(t => {
      rows.push([
        new Date(t.transaction_date).toLocaleDateString('es-AR'),
        t.item_name || t.description || 'Sin nombre',
        t.categories?.name || 'Otros',
        METHODS[t.payment_method] || t.payment_method,
        t.amount_cents,
      ]);
    });

  // Total
  rows.push([]);
  const total = expenses.reduce((s, t) => s + t.amount_cents, 0);
  rows.push(['', '', '', 'TOTAL', total]);
  boldRows.push(rows.length - 1);

  return {
    rows,
    merges,
    boldRows,
    headerRow: 2,
    colWidths: [12, 28, 16, 16, 14],
    moneyStartCol: 4,
  };
}

function applyStyles(ws, config) {
  const { merges, boldRows, headerRow, colWidths, moneyStartCol } = config;

  // Merges
  if (merges?.length) ws['!merges'] = merges;

  // Column widths
  if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));

  // Format money cells and apply number format
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      // Number format for money columns
      if (c >= moneyStartCol && typeof ws[addr].v === 'number') {
        ws[addr].z = '#,##0';
      }
    }
  }
}
