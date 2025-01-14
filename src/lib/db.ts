import { PrismaClient } from '@prisma/client';
import { GameConfig, Guess } from '@prisma/client';

// PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Game Config Operations
export async function createGameConfig(data: Omit<GameConfig, 'id' | 'createdAt' | 'updatedAt'>) {
  return prisma.gameConfig.create({ data });
}

export async function getGameConfigByDate(date: Date) {
  return prisma.gameConfig.findFirst({
    where: { date },
    include: { guesses: true },
  });
}

export async function getLatestGameConfig() {
  return prisma.gameConfig.findFirst({
    orderBy: { date: 'desc' },
    include: { guesses: true },
  });
}

// Guess Operations
export async function createGuess(data: Omit<Guess, 'id' | 'timestamp'>) {
  return prisma.guess.create({ data });
}

export async function getGuessesByGameConfig(gameConfigId: string) {
  return prisma.guess.findMany({
    where: { gameConfigId },
    orderBy: { timestamp: 'asc' },
  });
}

export async function getUserGuesses(userId: string, gameConfigId: string) {
  return prisma.guess.findMany({
    where: { userId, gameConfigId },
    orderBy: { timestamp: 'asc' },
  });
}

// Cache Operations
export async function cacheSpotifyTrack(spotifyId: string, data: string) {
  return prisma.cachedSpotifyTrack.upsert({
    where: { spotifyId },
    create: { spotifyId, data },
    update: { data, updatedAt: new Date() },
  });
}

export async function getCachedSpotifyTrack(spotifyId: string) {
  return prisma.cachedSpotifyTrack.findUnique({
    where: { spotifyId },
  });
}

export async function cacheSpotifyPlaylist(spotifyId: string, data: string) {
  return prisma.cachedSpotifyPlaylist.upsert({
    where: { spotifyId },
    create: { spotifyId, data },
    update: { data, updatedAt: new Date() },
  });
}

export async function getCachedSpotifyPlaylist(spotifyId: string) {
  return prisma.cachedSpotifyPlaylist.findUnique({
    where: { spotifyId },
  });
}

export async function cacheLyrics(geniusId: string, spotifyId: string, lyrics: string) {
  return prisma.cachedGeniusLyrics.upsert({
    where: { geniusId },
    create: { geniusId, spotifyId, lyrics },
    update: { lyrics, updatedAt: new Date() },
  });
}

export async function getCachedLyricsBySpotifyId(spotifyId: string) {
  return prisma.cachedGeniusLyrics.findUnique({
    where: { spotifyId },
  });
}
