import { AppError } from '../base';
import { ErrorCode } from '../codes';
import { ErrorMessage } from '../messages';

export class NoMatchingLyricsError extends AppError {
  constructor() {
    super(
      ErrorCode.NoMatchingLyrics,
      ErrorMessage[ErrorCode.NoMatchingLyrics] as string
    );
  }
}

export class LyricsExtractionError extends AppError {
  constructor(cause: Error) {
    const message = (ErrorMessage[ErrorCode.LyricsExtractionError] as (error: Error) => string)(cause);
    super(
      ErrorCode.LyricsExtractionError,
      message
    );
  }
} 
