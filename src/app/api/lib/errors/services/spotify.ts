import { NotFoundError } from '../base';

export class NoMatchingTracksError extends NotFoundError {
  constructor() {
    super('NO_MATCHING_TRACKS', 'No matching tracks found');
  }
}

export class NoMatchingPlaylistsError extends NotFoundError {
  constructor() {
    super('NO_MATCHING_PLAYLISTS', 'No matching playlists found');
  }
} 