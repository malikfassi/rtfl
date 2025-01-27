import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

import { GeniusClientImpl } from '@/app/api/lib/clients/genius';
import { SpotifyClientImpl } from '@/app/api/lib/clients/spotify';
import { GameService } from '@/app/api/lib/services/game';
import { GuessService } from '@/app/api/lib/services/guess';
import { SongService } from '@/app/api/lib/services/song';

import { prisma } from './db';

// Load environment variables from .env file
config();

/**
 * Integration test context providing access to:
 * - Database client
 * - Service instances with real external clients
 */
export interface IntegrationTestContext {
  prisma: PrismaClient;
  songService: SongService;
  gameService: GameService;
  guessService: GuessService;
  cleanup: () => Promise<void>;
}

/**
 * Cleans the database by deleting all records
 */
export async function cleanDatabase() {
  await prisma.$transaction(async (tx) => {
    // Disable foreign key checks for SQLite
    await tx.$executeRaw`PRAGMA foreign_keys = OFF;`;

    // Delete records from all tables in the correct order
    await tx.guess.deleteMany();
    await tx.game.deleteMany();
    await tx.song.deleteMany();

    // Re-enable foreign key checks
    await tx.$executeRaw`PRAGMA foreign_keys = ON;`;
  });
}

/**
 * Sets up a fresh integration test context with real database
 * and real external clients.
 * @returns IntegrationTestContext
 */
export async function setupIntegrationTest(): Promise<IntegrationTestContext> {
  // Clean existing data
  await cleanDatabase();

  // Create real client instances
  const spotifyClient = new SpotifyClientImpl(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!
  );
  const geniusClient = new GeniusClientImpl(
    process.env.GENIUS_ACCESS_TOKEN!
  );

  // Create services with real dependencies
  const songService = new SongService(prisma, spotifyClient, geniusClient);
  const gameService = new GameService(songService, prisma);
  const guessService = new GuessService(prisma);

  return {
    prisma,
    songService,
    gameService,
    guessService,
    cleanup: cleanDatabase
  };
}

/**
 * Cleans up the integration test context
 */
export async function cleanupIntegrationTest() {
  try {
    await cleanDatabase();
  } catch (error) {
    console.error('Error during test cleanup:', error);
    throw error;
  }
} 