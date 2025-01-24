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
import type { SimplifiedPlaylist,Track } from '@spotify/web-api-ts-sdk';

import type { GeniusSearchResponse } from '@/app/types/genius';

import { type PlaylistKey, type PlaylistTestCase,type SongKey, type SongTestCase, TEST_CASES } from './core/test_cases';
import type { ErrorFixtures,GeniusFixtures, LyricsFixtures, SpotifyFixtures } from './core/types';
import { isGeniusFixtures, isLyricsFixtures,isSpotifyFixtures } from './core/types';
import { validators } from './core/validators';
import { PLAYLIST_IDS,SONG_IDS } from './spotify_ids';

// Re-export everything
export type { 
  ErrorFixtures,
  GeniusFixtures, 
  GeniusSearchResponse,
  LyricsFixtures, 
  PlaylistKey,
  PlaylistTestCase,
  SimplifiedPlaylist, 
  SongKey,
  SongTestCase,
  SpotifyFixtures, 
  Track};

export { 
  isGeniusFixtures,
  isLyricsFixtures,
  isSpotifyFixtures,
  PLAYLIST_IDS,
  SONG_IDS,
  TEST_CASES,
  validators};

export * from './core/test_cases';
export * from './core/types';
export * from './core/validators';
export * from './spotify_ids';