export enum ErrorCode {
  // API Errors
  API_ERROR = 'API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Spotify Errors
  SPOTIFY_AUTH_ERROR = 'SPOTIFY_AUTH_ERROR',
  SPOTIFY_API_ERROR = 'SPOTIFY_API_ERROR',
  SPOTIFY_RATE_LIMIT = 'SPOTIFY_RATE_LIMIT',

  // Genius Errors
  GENIUS_AUTH_ERROR = 'GENIUS_AUTH_ERROR',
  GENIUS_API_ERROR = 'GENIUS_API_ERROR',
  GENIUS_RATE_LIMIT = 'GENIUS_RATE_LIMIT',

  // Cache Errors
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_MISS = 'CACHE_MISS',

  // Game Errors
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  INVALID_WORD = 'INVALID_WORD',
  INVALID_DATE = 'INVALID_DATE',
}

export class BaseError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class APIError extends BaseError {
  constructor(
    code: ErrorCode = ErrorCode.API_ERROR,
    message: string = 'API Error',
    statusCode: number = 500,
    retryable: boolean = false,
  ) {
    super(code, message, statusCode, retryable);
  }
}

export class RateLimitError extends APIError {
  constructor(service: string, retryAfter?: number) {
    super(
      ErrorCode.RATE_LIMITED,
      `Rate limit exceeded for ${service}${retryAfter ? `. Try again after ${retryAfter} seconds` : ''}`,
      429,
      true,
    );
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, false);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, 401, false);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404, false);
  }
}

// Spotify specific errors
export class SpotifyError extends APIError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SPOTIFY_API_ERROR,
    statusCode: number = 500,
  ) {
    super(code, message, statusCode);
  }
}

export class SpotifyAuthError extends SpotifyError {
  constructor(message: string = 'Spotify authentication failed') {
    super(message, ErrorCode.SPOTIFY_AUTH_ERROR, 401);
  }
}

// Genius specific errors
export class GeniusError extends APIError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.GENIUS_API_ERROR,
    statusCode: number = 500,
  ) {
    super(code, message, statusCode);
  }
}

export class GeniusAuthError extends GeniusError {
  constructor(message: string = 'Genius authentication failed') {
    super(message, ErrorCode.GENIUS_AUTH_ERROR, 401);
  }
}

// Game specific errors
export class GameError extends APIError {
  constructor(message: string, code: ErrorCode, statusCode: number = 400) {
    super(code, message, statusCode);
  }
}

export class GameNotFoundError extends GameError {
  constructor(date: string) {
    super(`Game not found for date: ${date}`, ErrorCode.GAME_NOT_FOUND, 404);
  }
}

export class InvalidWordError extends GameError {
  constructor(word: string) {
    super(`Invalid word: ${word}`, ErrorCode.INVALID_WORD, 400);
  }
}
