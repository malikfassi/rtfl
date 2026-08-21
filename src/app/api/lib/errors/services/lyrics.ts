import { AppError } from '../base';
import { ErrorCode } from '../codes';
import { ErrorMessage } from '../messages';

// NoMatchingLyricsError lives in ./genius - see the note there.
export class LyricsExtractionError extends AppError {
  constructor(cause: Error) {
    const message = (ErrorMessage[ErrorCode.LyricsExtractionError] as (error: Error) => string)(cause);
    super(
      ErrorCode.LyricsExtractionError,
      message
    );
  }
} 
