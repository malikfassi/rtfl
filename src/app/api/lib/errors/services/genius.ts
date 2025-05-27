import { AppError, NotFoundError } from '../base';

export class LyricsExtractionError extends AppError {
  static readonly code = 'LYRICS_EXTRACTION_ERROR';

  constructor(error: Error) {
    super(LyricsExtractionError.code, `Failed to extract lyrics: ${error.message}`, 500);
  }
}

export class NoMatchingLyricsError extends AppError {
  static readonly code = 'NO_MATCHING_LYRICS';
  static readonly message = 'No matching lyrics found';

  constructor() {
    super(NoMatchingLyricsError.code, NoMatchingLyricsError.message, 404);
  }
}
