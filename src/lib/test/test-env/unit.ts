import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SongService } from '@/lib/services/song';
import { GameService } from '@/lib/services/game';
import { GuessService } from '@/lib/services/guess';
import { SpotifyClientMock } from '@/lib/test/mocks/spotify';
import { GeniusClientMock } from '@/lib/test/mocks/genius';

/**
 * Unit test context providing access to:
 * - Mocked database client
 * - Service instances with mocked dependencies
 * - Mock external clients
 */
export interface UnitTestContext {
  mockPrisma: DeepMockProxy<PrismaClient>;
  mockGameService: GameService;
  mockSongService: SongService;
  mockGuessService: GuessService;
  mockSpotifyClient: SpotifyClientMock;
  mockGeniusClient: GeniusClientMock;
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
  const mockSpotifyClient = new SpotifyClientMock();
  const mockGeniusClient = new GeniusClientMock();

  // Create services with mocked dependencies
  const mockSongService = new SongService(mockPrisma, mockSpotifyClient, mockGeniusClient);
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