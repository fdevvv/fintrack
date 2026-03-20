/**
 * Validation utilities for financial data.
 * All validation returns { valid: boolean, errors: string[] }
 */

const VALID_CURRENCIES = ['ARS', 'USD'];
const VALID_TYPES = ['income', 'expense'];
const VALID_PAYMENT_METHODS = ['cash', 'transfer', 'qr_debit', 'credit_card', 'debit_card'];
const MAX_AMOUNT_CENTS = 999_999_999_99; // ~$10M max per transaction
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ITEM_NAME_LENGTH = 200;

export function validateTransaction(data) {
  const errors = [];

  // Amount
  if (!data.amount_cents && data.amount_cents !== 0) {
    errors.push('El monto es obligatorio');
  } else if (!Number.isInteger(data.amount_cents) || data.amount_cents <= 0) {
    errors.push('El monto debe ser un número positivo');
  } else if (data.amount_cents > MAX_AMOUNT_CENTS) {
    errors.push('El monto excede el máximo permitido');
  }

  // Type
  if (!VALID_TYPES.includes(data.type)) {
    errors.push('Tipo debe ser "income" o "expense"');
  }

  // Currency
  if (!VALID_CURRENCIES.includes(data.currency)) {
    errors.push('Moneda debe ser ARS o USD');
  }

  // Payment method
  if (data.payment_method && !VALID_PAYMENT_METHODS.includes(data.payment_method)) {
    errors.push('Método de pago inválido');
  }

  // Date
  if (data.transaction_date) {
    const date = new Date(data.transaction_date);
    if (isNaN(date.getTime())) {
      errors.push('Fecha inválida');
    }
    // Don't allow future dates more than 1 day ahead (timezone tolerance)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date > tomorrow) {
      errors.push('No se permiten fechas futuras');
    }
  }

  // Description length
  if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Descripción máxima: ${MAX_DESCRIPTION_LENGTH} caracteres`);
  }

  // Item name
  if (data.item_name && data.item_name.length > MAX_ITEM_NAME_LENGTH) {
    errors.push(`Nombre de item máximo: ${MAX_ITEM_NAME_LENGTH} caracteres`);
  }

  // Sanitize strings
  if (data.description) {
    data.description = sanitizeString(data.description);
  }
  if (data.item_name) {
    data.item_name = sanitizeString(data.item_name);
  }

  return { valid: errors.length === 0, errors };
}

export function validateBudget(data) {
  const errors = [];

  if (!data.category_id) {
    errors.push('La categoría es obligatoria');
  }

  if (!data.limit_cents || !Number.isInteger(data.limit_cents) || data.limit_cents <= 0) {
    errors.push('El límite debe ser un número positivo');
  }

  if (!data.year || data.year < 2020 || data.year > 2100) {
    errors.push('Año inválido');
  }

  if (!data.month || data.month < 1 || data.month > 12) {
    errors.push('Mes inválido (1-12)');
  }

  if (!VALID_CURRENCIES.includes(data.currency)) {
    errors.push('Moneda debe ser ARS o USD');
  }

  return { valid: errors.length === 0, errors };
}

export function validateCategory(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('El nombre es obligatorio');
  } else if (data.name.length > 50) {
    errors.push('Nombre máximo: 50 caracteres');
  }

  if (!VALID_TYPES.includes(data.type)) {
    errors.push('Tipo debe ser "income" o "expense"');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Basic XSS prevention — strip HTML tags, trim whitespace.
 */
function sanitizeString(str) {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, (c) => ({
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    }[c]))
    .trim();
}

export { VALID_CURRENCIES, VALID_TYPES, VALID_PAYMENT_METHODS };
