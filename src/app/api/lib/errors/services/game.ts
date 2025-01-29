import { NotFoundError } from '../base';
import { ErrorCode } from '../codes';
import { ErrorMessage } from '../messages';

export class GameNotFoundError extends NotFoundError {
  constructor(date: string) {
    const message = (ErrorMessage[ErrorCode.GameNotFound] as (date: string) => string)(date);
    super(ErrorCode.GameNotFound, message);
  }
}