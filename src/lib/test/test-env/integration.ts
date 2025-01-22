import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';
import { SongService } from '@/lib/services/song';
import { GameService } from '@/lib/services/game';
import { GuessService } from '@/lib/services/guess';
import { SpotifyClientImpl } from '@/lib/clients/spotify';
import { GeniusClientImpl } from '@/lib/clients/genius';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

/**
 * Integration test context providing access to:
 * - Database client
 * - Service instances with real external clients
 */
export interface IntegrationTestContext {
  prisma: PrismaClient;
  gameService: GameService;
  songService: SongService;
  guessService: GuessService;
}

/**
 * Cleans the database by deleting all records
 */
async function cleanDatabase() {
  await prisma.guess.deleteMany();
  await prisma.game.deleteMany();
  await prisma.song.deleteMany();
}

/**
 * Sets up a fresh integration test context with real database
 * and real external clients.
 * @returns IntegrationTestContext
 */
export async function setupIntegrationTest(): Promise<IntegrationTestContext> {
  // Clean database first
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
    gameService,
    songService,
    guessService
  };
}

/**
 * Cleans up the integration test context
 */
export async function cleanupIntegrationTest() {
  // Clean database
  await cleanDatabase();
} 