export const ERROR_MESSAGES = {
  // Date validation errors
  INVALID_DATE: 'Invalid date format. Please use YYYY-MM-DD',
  INVALID_MONTH: 'Invalid month format. Please use YYYY-MM',
  FUTURE_DATE: 'This date is in the future',
  
  // Game errors
  GAME_NOT_FOUND: 'The requested game could not be found',
  GAME_LOAD_FAILED: 'Failed to load game',
  GAME_FETCH_FAILED: 'Failed to fetch game',
  
  // Archive errors
  INVALID_ARCHIVE_MONTH: 'Invalid archive month format. Please use YYYY-MM (e.g., 2024-01)',
  
  // Generic errors
  GENERIC_ERROR: 'An error occurred',
  LOADING_ERROR: 'An error occurred while loading',
  NETWORK_ERROR: 'Network error. Please check your connection',
  
  // Rickroll messages
  RICKROLL_TITLE: '🎵',
  RICKROLL_SUBTITLE: 'Enjoy this special game!',
  
  // Archive messages
  ARCHIVE_INVALID_MONTH: 'This is not a valid archive month.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

export function getErrorMessage(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key];
} 