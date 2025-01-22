import { ValidationError } from './base';

export class MissingTrackSearchQueryError extends ValidationError {
  constructor() {
    super('Missing track search query');
  }
}

export class InvalidTrackSearchQueryError extends ValidationError {
  constructor(query: string) {
    super(`Invalid track search query: ${query}`);
  }
}

export class TrackSearchError extends ValidationError {
  constructor(error: Error) {
    super(`Failed to search tracks: ${error.message}`);
  }
} 