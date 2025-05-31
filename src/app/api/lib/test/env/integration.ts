import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

import { SpotifyClientImpl } from '@/app/api/lib/clients/spotify';
import { GameService } from '@/app/api/lib/services/game';
import { GuessService } from '@/app/api/lib/services/guess';
import { SongService } from '@/app/api/lib/services/song';
import { geniusService } from '@/app/api/lib/services/genius';
import { integration_validator } from '../validators';
import { TEST_IDS, TEST_DATES, TEST_PLAYERS } from '../constants';
import { fixtures } from '../fixtures';
import { createParallelTestDb } from './parallel-db';

// Load environment variables from .env file
config();

/**
 * Integration test context providing access to:
 * - Database client
 * - Service instances with real external clients
 * - Test utilities (validators, fixtures, constants)
 */
export interface IntegrationTestContext {
  // Database and services
  prisma: PrismaClient;
  songService: SongService;
  gameService: GameService;
  guessService: GuessService;
  
  // Test utilities
  validator: typeof integration_validator;
  fixtures: typeof fixtures;
  constants: {
    ids: typeof TEST_IDS;
    dates: typeof TEST_DATES;
    players: typeof TEST_PLAYERS;
  };

  // Cleanup
  cleanup: () => Promise<void>;
}

/**
 * Sets up a fresh integration test context with isolated database
 * and real external clients.
 * @returns IntegrationTestContext
 */
export async function setupIntegrationTest(): Promise<IntegrationTestContext> {
  // Create an isolated test database for this test
  const { prisma: testPrisma, cleanup: dbCleanup } = await createParallelTestDb();

  // Create real client instances
  const spotifyClient = new SpotifyClientImpl(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!
  );

  // Create services with real dependencies
  const songService = new SongService(testPrisma, spotifyClient, geniusService);
  const gameService = new GameService(songService, testPrisma);
  const guessService = new GuessService(testPrisma);

  return {
    prisma: testPrisma,
    songService,
    gameService,
    guessService,
    validator: integration_validator,
    fixtures,
    constants: {
      ids: TEST_IDS,
      dates: TEST_DATES,
      players: TEST_PLAYERS
    },
    cleanup: dbCleanup
  };
}

/**
 * Cleans up the integration test context
 * This is now handled by the parallel database cleanup
 */
export async function cleanupIntegrationTest() {
  // Cleanup is handled by the context's cleanup function
  // This function is kept for backward compatibility
} 