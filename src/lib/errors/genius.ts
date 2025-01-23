import { NotFoundError, InternalError } from './base';

export class GeniusApiError extends InternalError {
  constructor(error: Error) {
    super(`Genius API error: ${error.message}`);
  }
}

export class NoLyricsFoundError extends NotFoundError {
  constructor() {
    super('No lyrics found');
  }
}

export class NoMatchingLyricsError extends NotFoundError {
  constructor() {
    super('No matching lyrics found');
  }
}

export class LyricsExtractionError extends InternalError {
  constructor(error: Error) {
    super(`Failed to extract lyrics: ${error.message}`);
  }
} 