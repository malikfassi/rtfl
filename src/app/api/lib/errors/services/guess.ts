import { AppError, NotFoundError } from '../base';
import { ErrorCode } from '../codes';
import { ErrorMessage } from '../messages';

export class DuplicateGuessError extends AppError {
  constructor() {
    super(ErrorCode.DuplicateGuess, ErrorMessage[ErrorCode.DuplicateGuess] as string, 400);
  }
}

export class GameNotFoundForGuessError extends NotFoundError {
  constructor(date: string) {
    const message = (ErrorMessage[ErrorCode.GameNotFoundForGuess] as (date: string) => string)(date);
    super(ErrorCode.GameNotFoundForGuess, message);
  }
} 