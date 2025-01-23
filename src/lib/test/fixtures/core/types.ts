import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '@/types/genius';

export type SpotifyFixtures = {
  tracks: Record<string, Track>;
  playlists: Record<string, SimplifiedPlaylist>;
  playlistTracks: Record<string, Track[]>;
  errors?: {
    playlists: Record<string, {
      status: number;
      message: string;
    }>;
    tracks: Record<string, {
      status: number;
      message: string;
    }>;
  };
};

export type GeniusFixtures = {
  byId: Record<string, GeniusSearchResponse>;
  byQuery: Record<string, GeniusSearchResponse>;
};

export type LyricsFixtures = Record<string, string>;

export type ErrorFixtures = {
  genius: Record<string, {
    status: number;
    message: string;
    type: 'NO_MATCH' | 'EXTRACTION_FAILED' | 'API_ERROR';
  }>;
};

// Type guards
export const isSpotifyFixtures = (data: unknown): data is SpotifyFixtures => {
  if (!data || typeof data !== 'object') return false;
  const d = data as SpotifyFixtures;
  return (
    'tracks' in d &&
    'playlists' in d &&
    'playlistTracks' in d &&
    typeof d.tracks === 'object' &&
    typeof d.playlists === 'object' &&
    typeof d.playlistTracks === 'object'
  );
};

export const isGeniusFixtures = (data: unknown): data is GeniusFixtures => {
  if (!data || typeof data !== 'object') return false;
  const d = data as GeniusFixtures;
  return (
    'byId' in d &&
    'byQuery' in d &&
    typeof d.byId === 'object' &&
    typeof d.byQuery === 'object'
  );
};

export const isLyricsFixtures = (data: unknown): data is LyricsFixtures => {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return Object.values(d).every(v => typeof v === 'string');
}; 