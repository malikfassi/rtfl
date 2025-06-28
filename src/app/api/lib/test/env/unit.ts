import type { Track, Page, Playlist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse, GeniusServiceInterface } from '@/app/types';
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
  mockGeniusService: jest.Mocked<GeniusServiceInterface>;

  // Prisma mock
  mockPrisma: {
    game: {
      findUnique: jest.Mock<unknown, [unknown]>;
      upsert: jest.Mock<unknown, [unknown]>;
      findMany: jest.Mock<unknown, [unknown]>;
    };
    guess: {
      findFirst: jest.Mock<unknown, [unknown]>;
      create: jest.Mock<unknown, [unknown]>;
      findMany: jest.Mock<unknown, [unknown]>;
    };
    song: {
      create: jest.Mock<unknown, [unknown]>;
      findFirst: jest.Mock<unknown, [unknown]>;
      findUnique: jest.Mock<unknown, [unknown]>;
    };
    $transaction: jest.Mock<unknown, [unknown]>;
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
  
  // Create a mock GeniusService that implements GeniusServiceInterface
  const mockGeniusService: jest.Mocked<GeniusServiceInterface> = {
    search: jest.fn(),
    findMatch: jest.fn()
  };

  // Mock Prisma client
  let mockPrisma: UnitTestContext['mockPrisma'] = {
    game: {} as {
      findUnique: jest.Mock<unknown, [unknown]>;
      upsert: jest.Mock<unknown, [unknown]>;
      findMany: jest.Mock<unknown, [unknown]>;
    },
    guess: {} as {
      findFirst: jest.Mock<unknown, [unknown]>;
      create: jest.Mock<unknown, [unknown]>;
      findMany: jest.Mock<unknown, [unknown]>;
    },
    song: {} as {
      create: jest.Mock<unknown, [unknown]>;
      findFirst: jest.Mock<unknown, [unknown]>;
      findUnique: jest.Mock<unknown, [unknown]>;
    },
    $transaction: jest.fn(async (cb: (arg: Omit<UnitTestContext['mockPrisma'], '$transaction'>) => unknown) => cb({
      game: mockPrisma.game,
      guess: mockPrisma.guess,
      song: mockPrisma.song,
    })) as jest.Mock<unknown, [unknown]>,
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
    mockGeniusService,
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