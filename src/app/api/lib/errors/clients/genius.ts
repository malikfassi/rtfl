import { AppError } from '../base';

export class GeniusApiError extends AppError {
  static readonly code = 'GENIUS_API_ERROR';

  constructor(error: Error) {
    super(GeniusApiError.code, `Genius API error: ${error.message}`, 500);
  }

  static missingQuery(): GeniusApiError {
    return new GeniusApiError(new Error('Query is required'));
  }

  static missingUrl(): GeniusApiError {
    return new GeniusApiError(new Error('URL is required'));
  }

  static requestFailed(status: number, statusText: string): GeniusApiError {
    return new GeniusApiError(new Error(`Request failed: ${status} ${statusText}`));
  }
}