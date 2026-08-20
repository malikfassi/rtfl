import type { Track } from '@spotify/web-api-ts-sdk';

export function getTrackTitle(track: Track | null | undefined): string {
  return track?.name || '';
}

// `artists` is non-optional on Track, but a Track narrowed out of stored JSON
// need not actually have it, so guard the access rather than trusting the type.
export function getTrackArtist(track: Track | null | undefined): string {
  return track?.artists?.map(artist => artist.name).join(', ') || '';
}

