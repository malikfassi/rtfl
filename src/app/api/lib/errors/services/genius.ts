import { AppError } from '../base';

// LyricsExtractionError lives in ./lyrics - this file used to carry a second
// copy under the same name but with a hardcoded code, so which one you
// imported changed the code the API emitted.
export class NoMatchingLyricsError extends AppError {
  static readonly code = 'NO_MATCHING_LYRICS';
  static readonly message = 'No matching lyrics found';

  constructor() {
    super(NoMatchingLyricsError.code, NoMatchingLyricsError.message, 404);
  }
}
