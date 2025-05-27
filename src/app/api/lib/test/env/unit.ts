import type { Track, Page, Playlist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '../../types/genius';
import { TEST_IDS, TEST_DATES, TEST_PLAYERS } from '../constants';
import { fixtures } from '../fixtures';
import { unit_validator } from '../validators/unit';
import { SpotifyMocks } from '../mocks/spotify';
import { GeniusMocks } from '../mocks/genius';

export interface SpotifyClient {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
  searchPlaylists(query: string): Promise<Page<Playlist>>;
  getPlaylistTracks(id: string): Promise<Track[]>;
}

export interface GeniusClient {
  search(query: string): Promise<GeniusSearchResponse>;
  fetchLyricsPage(url: string): Promise<string>;
  getLyrics(url: string): Promise<string>;
}

/**
 * Unit test context providing access to:
 * - Mock external clients
 * - Test utilities (validators, fixtures)
 */
export interface UnitTestContext {
  // External clients
  mockSpotifyClient: jest.Mocked<SpotifyClient>;
  mockGeniusClient: jest.Mocked<GeniusClient>;

  // Test utilities
  validator: typeof unit_validator;
  fixtures: typeof fixtures;
  constants: {
    ids: typeof TEST_IDS;
    dates: typeof TEST_DATES;
    players: typeof TEST_PLAYERS;
  };
}

/**
 * Sets up a fresh unit test context with all dependencies mocked.
 * @returns UnitTestContext with mocked services and clients
 */
export function setupUnitTest(): UnitTestContext {
  const mockSpotifyClient = SpotifyMocks.createClient();
  const mockGeniusClient = GeniusMocks.createClient();

  return {
    mockSpotifyClient,
    mockGeniusClient,
    validator: unit_validator,
    fixtures,
    constants: {
      ids: TEST_IDS,
      dates: TEST_DATES,
      players: TEST_PLAYERS
    }
  };
}

/**
 * Cleans up the unit test context and resets all mocks
 */
export function cleanupUnitTest() {
  jest.resetAllMocks();
} 