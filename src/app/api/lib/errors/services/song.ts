import { NotFoundError } from '../base';
import { ErrorCode } from '../codes';
import { ErrorMessage } from '../messages';

export class SongNotFoundError extends NotFoundError {
  constructor(spotifyId: string) {
    const message = (ErrorMessage[ErrorCode.SongNotFound] as (spotifyId: string) => string)(spotifyId);
    super(ErrorCode.SongNotFound, message);
  }
} 