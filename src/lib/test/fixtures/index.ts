/**
 * Test Fixtures
 * 
 * This module provides access to test fixtures and utilities for different types of tests.
 * For detailed usage examples and best practices, see the README.md file in this directory.
 * 
 * Quick examples:
 * ```typescript
 * // Get song data
 * const songFixture = fixtures.getSongFixture(SONGS.PARTY_IN_THE_USA);
 * 
 * // Get playlist data
 * const playlistFixture = fixtures.getPlaylistFixture(PLAYLIST_IDS[0]);
 * 
 * // Test error cases
 * expect(() => fixtures.getSongFixture(SONGS.UNKNOWN_SONG))
 *   .toThrow('Track error: 404');
 * ```
 * 
 * @see README.md for comprehensive documentation and examples
 */

// Core types and constants
import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '@/types/genius';
import type { SpotifyFixtures, GeniusFixtures, LyricsFixtures, ErrorFixtures } from './core/types';
import { isSpotifyFixtures, isGeniusFixtures, isLyricsFixtures } from './core/types';
import { TEST_CASES, type SongKey, type PlaylistKey, type SongTestCase, type PlaylistTestCase } from './core/test_cases';
import { validators } from './core/validators';
import { SONG_IDS, PLAYLIST_IDS } from './spotify_ids';

// Re-export everything
export type { 
  Track, 
  SimplifiedPlaylist, 
  GeniusSearchResponse,
  SpotifyFixtures, 
  GeniusFixtures, 
  LyricsFixtures, 
  ErrorFixtures,
  SongKey,
  PlaylistKey,
  SongTestCase,
  PlaylistTestCase
};

export { 
  TEST_CASES,
  validators,
  SONG_IDS,
  PLAYLIST_IDS,
  isSpotifyFixtures,
  isGeniusFixtures,
  isLyricsFixtures
};

export * from './core/test_cases';
export * from './core/types';
export * from './core/validators';
export * from './spotify_ids';