import { AppError, ValidationError, NotFoundError } from './base';

export class GeniusError extends AppError {
  constructor(message: string) {
    super('GENIUS_ERROR', message, 500);
  }
}

export class GeniusApiError extends GeniusError {
  constructor(error: Error) {
    super(`Genius API error: ${error.message}`);
  }
}

export class LyricsNotFoundError extends NotFoundError {
  constructor() {
    super('Lyrics not found');
  }
}

export class MissingLyricsUrlError extends ValidationError {
  constructor() {
    super('Missing lyrics URL');
  }
}

export class LyricsPageError extends GeniusError {
  constructor(error: Error) {
    super(`Failed to fetch lyrics page: ${error.message}`);
  }
} 