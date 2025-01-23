import { NotFoundError } from './base';

export class NoLyricsFoundError extends NotFoundError {
  constructor() {
    super('No lyrics found');
  }
}

export class SongNotFoundError extends NotFoundError {
  constructor(spotifyId: string) {
    super(`Song not found with Spotify ID: ${spotifyId}`);
  }
} 