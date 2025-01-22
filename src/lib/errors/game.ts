import { AppError, ValidationError, NotFoundError } from './base';

export class GameError extends AppError {
  constructor(message: string) {
    super('GAME_ERROR', message, 500);
  }
}

export class InvalidGameDateError extends ValidationError {
  constructor(date?: string) {
    super(date ? `Invalid date format: ${date}` : 'Invalid date format. Expected YYYY-MM-DD');
  }
}

export class InvalidGameMonthError extends ValidationError {
  constructor(month?: string) {
    super(month ? `Invalid month format: ${month}` : 'Invalid month format. Expected YYYY-MM');
  }
}

export class GameNotFoundError extends NotFoundError {
  constructor(date: string) {
    super(`Game not found for date: ${date}`);
  }
}

export class GameCreationError extends GameError {
  constructor(error: Error) {
    super(`Failed to create game: ${error.message}`);
  }
}

export class GameDeletionError extends GameError {
  constructor(error: Error) {
    super(`Failed to delete game: ${error.message}`);
  }
}

export class GameUpdateError extends GameError {
  constructor(error: Error) {
    super(`Failed to update game: ${error.message}`);
  }
}

export class MissingGameDateError extends ValidationError {
  constructor() {
    super('Missing game date');
  }
}

export class MissingGameSpotifyIdError extends ValidationError {
  constructor() {
    super('Missing game Spotify ID');
  }
}

export class MissingGameRequestBodyError extends ValidationError {
  constructor() {
    super('Missing game request body');
  }
}

export class NoLyricsForGameError extends GameError {
  constructor() {
    super('No lyrics found for this song');
  }
} 