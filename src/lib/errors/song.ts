import { AppError, ValidationError, NotFoundError } from './base';

export class SongError extends AppError {
  constructor(message: string) {
    super('SONG_ERROR', message, 500);
  }
}

export class SongNotFoundError extends NotFoundError {
  constructor() {
    super('Song not found');
  }
}

export class InvalidTrackIdError extends ValidationError {
  constructor(trackId: string) {
    super(`Invalid track ID format: ${trackId}`);
  }
}

export class SongCreationError extends SongError {
  constructor(error: Error) {
    super(`Failed to create song: ${error.message}`);
  }
}

export class NoLyricsFoundError extends NotFoundError {
  constructor() {
    super('No lyrics found for this song');
  }
} 