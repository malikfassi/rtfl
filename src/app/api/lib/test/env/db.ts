import { PrismaClient } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '@/app/api/lib/types/genius';

/**
 * Database client for test environment
 */
export const prisma = new PrismaClient();

/**
 * Sets up test database
 * Creates SQLite database and pushes latest schema
 */
export async function setupTestDb() {
  try {
    // Ensure client is connected
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Cleans up test database
 * Disconnects Prisma client
 */
export async function cleanupTestDb() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    throw error;
  }
}

/**
 * Resets test database
 * Cleans all tables while maintaining schema
 */
export async function resetTestDb() {
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
 * Database utilities for test environment
 */
export const db = {
  create: {
    game: async (prisma: PrismaClient, data: { 
      date: string, 
      spotify: { 
        track: Track
      }, 
      genius: {
        search: GeniusSearchResponse,
        lyrics: string
      }
    }) => {
      return await prisma.game.create({
        data: {
          date: data.date,
          song: {
            create: {
              spotifyId: data.spotify.track.id,
              spotifyData: JSON.parse(JSON.stringify(data.spotify.track)),
              geniusData: JSON.parse(JSON.stringify(data.genius.search)),
              lyrics: data.genius.lyrics,
              maskedLyrics: data.genius.lyrics // TODO: Add proper masking
            }
          }
        },
        include: {
          song: true
        }
      });
    }
  },
  cleanup: {
    game: async (prisma: PrismaClient, date: string) => {
      const game = await prisma.game.findUnique({
        where: { date },
        include: { song: true }
      });

      if (game) {
        await prisma.game.delete({
          where: { id: game.id }
        });
      }
    }
  }
}; 