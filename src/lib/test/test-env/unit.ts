import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SongService } from '@/lib/services/song';
import { GameService } from '@/lib/services/game';
import { GuessService } from '@/lib/services/guess';
import type { SpotifyClient } from '@/lib/clients/spotify';
import type { GeniusClient } from '@/lib/clients/genius';

/**
 * Unit test context providing access to:
 * - Mocked database client
 * - Service instances with mocked dependencies
 * - Mock external clients
 */
export interface UnitTestContext {
  mockPrisma: DeepMockProxy<PrismaClient>;
  mockGameService: GameService;
  mockSongService: jest.Mocked<SongService>;
  mockGuessService: GuessService;
  mockSpotifyClient: jest.Mocked<SpotifyClient>;
  mockGeniusClient: jest.Mocked<GeniusClient>;
  mockTx: DeepMockProxy<PrismaClient>;
}

/**
 * Sets up a fresh unit test context with all dependencies mocked.
 * @returns UnitTestContext with mocked services and clients
 */
export function setupUnitTest(): UnitTestContext {
  // Create mock instances
  const mockPrisma = mockDeep<PrismaClient>();
  const mockTx = mockDeep<PrismaClient>();
  
  // Create mock clients
  const mockSpotifyClient = {
    getTrack: jest.fn(),
    searchTracks: jest.fn(),
    searchPlaylists: jest.fn(),
    getPlaylistTracks: jest.fn()
  };

  const mockGeniusClient = {
    search: jest.fn(),
    getLyrics: jest.fn()
  };

  // Create mock services
  const mockSongService = {
    create: jest.fn(),
    searchTracks: jest.fn(),
    getBySpotifyId: jest.fn(),
    getTrack: jest.fn(),
    getMaskedLyrics: jest.fn(),
    fetchExternalData: jest.fn(),
    findBestMatch: jest.fn(),
    createSongInDb: jest.fn(),
    prisma: mockPrisma,
    spotifyClient: mockSpotifyClient,
    geniusClient: mockGeniusClient
  } as unknown as jest.Mocked<SongService>;

  const mockGameService = new GameService(mockSongService, mockPrisma);
  const mockGuessService = new GuessService(mockPrisma);

  // Mock transaction
  mockPrisma.$transaction.mockImplementation((fn: unknown) => {
    if (Array.isArray(fn)) {
      // Handle array of promises
      return Promise.all(fn);
    }
    // Handle callback
    if (typeof fn === 'function') {
      return fn(mockTx);
    }
    throw new Error('Invalid transaction argument');
  });

  return {
    mockPrisma,
    mockGameService,
    mockSongService,
    mockGuessService,
    mockSpotifyClient,
    mockGeniusClient,
    mockTx
  };
}

/**
 * Cleans up the unit test context and resets all mocks
 */
export function cleanupUnitTest() {
  jest.resetAllMocks();
} 