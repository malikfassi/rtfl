import type { Game, Guess } from '@prisma/client';
import { prisma } from './prisma';

// Game Operations
export async function createGame(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) {
  return prisma.game.create({ data });
}

export async function getGameByDate(date: Date) {
  return prisma.game.findFirst({
    where: { date },
    include: { guesses: true },
  });
}

export async function getLatestGame() {
  return prisma.game.findFirst({
    orderBy: { date: 'desc' },
    include: { guesses: true },
  });
}

// Guess Operations
export async function createGuess(data: Omit<Guess, 'id' | 'timestamp'>) {
  return prisma.guess.create({ data });
}

export async function getGuessesByGame(gameId: string) {
  return prisma.guess.findMany({
    where: { gameId },
    orderBy: { timestamp: 'asc' },
  });
}

export async function getUserGuesses(userId: string, gameId: string) {
  return prisma.guess.findMany({
    where: { userId, gameId },
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
