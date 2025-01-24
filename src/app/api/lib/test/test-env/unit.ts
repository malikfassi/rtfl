import { PrismaClient } from '@prisma/client';
import { DeepMockProxy,mockDeep } from 'jest-mock-extended';

import type { GeniusClient } from '@/app/api/lib/clients/genius';
import type { SpotifyClient } from '@/app/api/lib/clients/spotify';
import { GameService } from '@/app/api/lib/services/game';
import { GuessService } from '@/app/api/lib/services/guess';
import { SongService } from '@/app/api/lib/services/song';

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
  
  // Ensure transaction mock has same methods as prisma mock
  mockTx.game.upsert.mockImplementation(mockPrisma.game.upsert);
  mockTx.game.findUnique.mockImplementation(mockPrisma.game.findUnique);
  mockTx.game.findMany.mockImplementation(mockPrisma.game.findMany);
  mockTx.game.delete.mockImplementation(mockPrisma.game.delete);
  
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
  mockPrisma.$transaction.mockImplementation(async (fn: unknown) => {
    if (Array.isArray(fn)) {
      // Handle array of promises
      return Promise.all(fn);
    }
    // Handle callback
    if (typeof fn === 'function') {
      const result = await fn(mockTx);
      return result;
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