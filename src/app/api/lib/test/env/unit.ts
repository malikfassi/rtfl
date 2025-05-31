import type { Track, Page, Playlist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '../../types/genius';
import { TEST_IDS, TEST_DATES, TEST_PLAYERS } from '../constants';
import { fixtures } from '../fixtures';
import { unit_validator } from '../validators/unit';
import { SpotifyMocks } from '../mocks/spotify';
import { GeniusMocks } from '../mocks/genius';
import { getGeniusUrlFromTrackKey } from '../utils/genius';
import { TRACK_KEYS } from '../constants';

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

  // Prisma mock
  mockPrisma: {
    game: {
      findUnique: jest.Mock<any, any>;
      upsert: jest.Mock<any, any>;
      findMany: jest.Mock<any, any>;
    };
    guess: {
      findFirst: jest.Mock<any, any>;
      create: jest.Mock<any, any>;
      findMany: jest.Mock<any, any>;
    };
    song: {
      create: jest.Mock<any, any>;
      findFirst: jest.Mock<any, any>;
      findUnique: jest.Mock<any, any>;
    };
    $transaction: jest.Mock<any, any>;
  };

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

  // Mock Prisma client
  const mockPrisma: any = {
    game: {},
    guess: {},
    song: {},
  };
  mockPrisma.game.findUnique = jest.fn();
  mockPrisma.game.upsert = jest.fn();
  mockPrisma.game.findMany = jest.fn();
  mockPrisma.guess.findFirst = jest.fn();
  mockPrisma.guess.create = jest.fn();
  mockPrisma.guess.findMany = jest.fn();
  mockPrisma.song.create = jest.fn();
  mockPrisma.song.findFirst = jest.fn();
  mockPrisma.song.findUnique = jest.fn();
  mockPrisma.$transaction = jest.fn(async (cb: any) => cb({
    game: mockPrisma.game,
    guess: mockPrisma.guess,
    song: mockPrisma.song,
  }));

  // Mock global fetch for lyrics HTML
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    // Try to find the track key whose Genius URL matches
    const trackKey = (Object.keys(TRACK_KEYS) as (keyof typeof TRACK_KEYS)[]).find(key => {
      const geniusUrl = getGeniusUrlFromTrackKey(key);
      return geniusUrl === url;
    });
    if (trackKey) {
      return {
        ok: true,
        text: async () => fixtures.genius.lyrics[trackKey]
      } as Response;
    }
    // Not found: return a 404-like response
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => ''
    } as Response;
  });

  return {
    mockSpotifyClient,
    mockGeniusClient,
    mockPrisma,
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