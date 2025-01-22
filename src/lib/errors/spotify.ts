import { AppError, ValidationError, NotFoundError } from './base';

export class SpotifyError extends AppError {
  constructor(message: string) {
    super('SPOTIFY_ERROR', message, 500);
  }
}

export class MissingTrackIdError extends ValidationError {
  constructor() {
    super('Missing track ID');
  }
}

export class TrackNotFoundError extends NotFoundError {
  constructor() {
    super('Track not found');
  }
}

export class MissingPlaylistIdError extends ValidationError {
  constructor() {
    super('Missing playlist ID');
  }
}

export class PlaylistNotFoundError extends NotFoundError {
  constructor() {
    super('Playlist not found');
  }
}

export class MissingSearchQueryError extends ValidationError {
  constructor() {
    super('Missing search query');
  }
}

export class SpotifyApiError extends SpotifyError {
  constructor(error: Error) {
    super(`Spotify API error: ${error.message}`);
  }
}

export class PlaylistTracksError extends SpotifyError {
  constructor(error: Error) {
    super(`Failed to fetch playlist tracks: ${error.message}`);
  }
} 