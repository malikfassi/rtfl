import type { Track } from '@spotify/web-api-ts-sdk';

export function getTrackTitle(track: Track | null | undefined): string {
  return track?.name || '';
}

export function getTrackArtist(track: Track | null | undefined): string {
  return track?.artists.map(artist => artist.name).join(', ') || '';
}

export function getTrackId(track: Track | null | undefined): string {
  return track?.id || '';
} 