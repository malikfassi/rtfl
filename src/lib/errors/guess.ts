import { AppError } from './base';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateGuessError extends Error {
  constructor() {
    super('Player has already submitted a guess for this game');
    this.name = 'DuplicateGuessError';
  }
}

export class InvalidWordError extends Error {
  constructor() {
    super('Word not found in lyrics');
    this.name = 'InvalidWordError';
  }
}

export class GameNotFoundForGuessError extends Error {
  code: string;
  status: number;

  constructor() {
    super('Game or song not found');
    this.name = 'GameNotFoundForGuessError';
    this.code = 'NOT_FOUND';
    this.status = 404;
  }
}

export class GuessError extends AppError {
  constructor(message: string) {
    super('GUESS_ERROR', message, 500);
  }
}

export class GuessSubmissionError extends GuessError {
  constructor(error: Error) {
    super(`Failed to submit guess: ${error.message}`);
  }
}

export class GuessRetrievalError extends GuessError {
  constructor(error: Error) {
    super(`Failed to get player guesses: ${error.message}`);
  }
} 