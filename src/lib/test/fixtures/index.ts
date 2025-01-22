// Re-export types
export type { GeniusSearchResponse, GeniusSearchResult } from '@/lib/clients/genius';
export type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
export type { LyricsFixture, LyricsJson } from './lyrics';

// Export fixtures and helpers
export { spotifyData } from './spotify';
export { geniusData } from './genius';
export { 
  getLyrics,
  getMaskedLyrics,
  getMaskedTitle,
  getMaskedArtist,
  lyricsJson
} from './lyrics';