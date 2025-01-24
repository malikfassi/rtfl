import { InternalError,NotFoundError } from './base';

export class SpotifyApiError extends InternalError {
  constructor(error: Error) {
    super(`Spotify API error: ${error.message}`);
  }
}

export class TrackNotFoundError extends NotFoundError {
  constructor() {
    super('Track not found');
  }
}

export class PlaylistNotFoundError extends NotFoundError {
  constructor(playlistId: string) {
    super(`Playlist not found: ${playlistId}`);
  }
}

export class NoMatchingTracksError extends NotFoundError {
  constructor() {
    super('No matching tracks found');
  }
}

export class NoMatchingPlaylistsError extends NotFoundError {
  constructor() {
    super('No matching playlists found');
  }
}

export class NoTracksInPlaylistError extends NotFoundError {
  constructor() {
    super('No tracks found in playlist');
  }
}

export class PlaylistTracksError extends InternalError {
  constructor(error: Error) {
    super(`Failed to fetch playlist tracks: ${error.message}`);
  }
} 