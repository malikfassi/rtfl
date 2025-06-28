/**
 * Format a date string (YYYY-MM-DD) into a human-readable format
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g. "January 1, 2024")
 */
export function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date string (YYYY-MM-DD) into a short format
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Short formatted date string (e.g. "Jan 1")
 */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 * @returns Yesterday's date string
 */
export function getYesterdayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date string is in the future
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Check if a date string is valid
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date string is valid
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get the number of days between two dates
 * @param date1 - First date string in YYYY-MM-DD format
 * @param date2 - Second date string in YYYY-MM-DD format
 * @returns Number of days between the dates
 */
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Parse a month string (YYYY-MM) into a Date object
 * @param monthStr - Month string in YYYY-MM format
 * @returns Date object set to the first day of the month
 * @throws Error if the month string is invalid
 */
export function parseMonthString(monthStr: string): Date {
  // Validate the format
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new Error(`Invalid month format: ${monthStr}. Expected YYYY-MM`);
  }
  
  const [year, month] = monthStr.split('-').map(Number);
  
  // Validate month range
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month value: ${month}. Month must be between 01-12`);
  }
  
  // Validate year range
  if (year < 1900 || year > 2100) {
    throw new Error(`Invalid year value: ${year}. Year must be between 1900-2100`);
  }
  
  const date = new Date(year, month - 1, 1);
  
  // Validate the resulting date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date created from month string: ${monthStr}`);
  }
  
  return date;
} 