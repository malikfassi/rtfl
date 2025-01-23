import { NotFoundError } from './base';

export class GameNotFoundError extends NotFoundError {
  constructor(date: string) {
    super(`Game not found for date: ${date}`);
  }
}