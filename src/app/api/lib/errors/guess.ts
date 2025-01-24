import { AppError, NotFoundError } from './base';

export class DuplicateGuessError extends AppError {
  constructor() {
    super('DUPLICATE_GUESS', 'Player has already submitted a guess for this game', 400);
  }
}

export class InvalidWordError extends AppError {
  constructor() {
    super('INVALID_WORD', 'Word not found in lyrics', 400);
  }
}

export class GameNotFoundForGuessError extends NotFoundError {
  constructor() {
    super('Game or song not found');
  }
} 