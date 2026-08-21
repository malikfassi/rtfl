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
function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Day counter shown in the header ("day 847"). No launch-date epoch exists
 * in the data model today, so this approximates from a fixed reference date
 * rather than claiming a real game-number — swap `RTFL_EPOCH` for the
 * actual first-game date if/when one is tracked.
 */
const RTFL_EPOCH = '2024-01-01';
export function getDayNumber(dateStr: string): number {
  if (!isValidDate(dateStr)) return 0;
  return getDaysBetween(RTFL_EPOCH, dateStr) + 1;
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