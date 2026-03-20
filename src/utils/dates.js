import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getMonthRange(year, month) {
  const date = new Date(year, month - 1);
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}

export function getPreviousMonths(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = subMonths(now, i);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: format(d, 'MMM yyyy', { locale: es }),
      key: format(d, 'yyyy-MM'),
    };
  }).reverse();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'dd/MM/yyyy');
}

export function formatMonthYear(year, month) {
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function toISODate(date) {
  return format(date, 'yyyy-MM-dd');
}
