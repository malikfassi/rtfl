import { AppError, NotFoundError } from '../base';

export class SpotifyApiError extends AppError {
  static readonly code = 'SPOTIFY_API_ERROR';

  constructor(error: Error) {
    super(SpotifyApiError.code, `Spotify API error: ${error.message}`, 500);
  }

  static missingCredentials(): SpotifyApiError {
    return new SpotifyApiError(new Error('Spotify credentials not configured'));
  }

  static requestFailed(status: number, statusText: string): SpotifyApiError {
    return new SpotifyApiError(new Error(`Request failed: ${status} ${statusText}`));
  }
}

export class TrackNotFoundError extends NotFoundError {
  constructor() {
    super('TRACK_NOT_FOUND', 'Track not found');
  }
}

export class PlaylistNotFoundError extends NotFoundError {
  constructor(playlistId: string) {
    super('PLAYLIST_NOT_FOUND', `Playlist not found: ${playlistId}`);
  }
}

export class NoMatchingTracksError extends NotFoundError {
  static readonly code = 'NO_MATCHING_TRACKS';
  static readonly message = 'No matching tracks found';

  constructor() {
    super(NoMatchingTracksError.code, NoMatchingTracksError.message);
  }
}