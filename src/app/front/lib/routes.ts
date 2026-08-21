import { format } from 'date-fns';
import { Route } from 'next';

function isValidMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

export function buildArchiveRoute(month: string): Route {
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month format: ${month}. Expected format: YYYY-MM`);
  }
  return `/archive/${month}` as Route;
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
