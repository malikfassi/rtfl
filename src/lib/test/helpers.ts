import { prisma } from '../db';
import type { Song, Game } from '@prisma/client';
import { Prisma } from '@prisma/client';

let songIdCounter = 0;
let dateCounter = 0;

export const getUniqueDate = () => {
  const date = new Date('2025-01-01');
  date.setDate(date.getDate() + dateCounter++);
  return formatDate(date);
};

export const createTestSong = async (
  overrides?: Partial<Omit<Song, 'maskedLyrics'>> & { maskedLyrics?: Prisma.InputJsonValue }
): Promise<Song> => {
  const uniqueId = `spotify:track:${Buffer.from(`test-song-${songIdCounter++}`).toString('base64').replace(/[+/=]/g, '')}`;
  const defaultSong = {
    spotifyId: uniqueId,
    title: 'Test Song',
    artist: 'Test Artist',
    previewUrl: 'https://test.com/preview.mp3',
    lyrics: 'Test lyrics\nSecond line\nThird line',
    maskedLyrics: {
      title: 'T*** S***',
      artist: 'T*** A*****',
      lyrics: 'T*** l*****\nS***** l***\nT**** l***',
    } satisfies Prisma.InputJsonValue,
  };

  try {
    // Try to find existing song with the same spotifyId
    const existingSong = await prisma.song.findUnique({
      where: { spotifyId: overrides?.spotifyId || uniqueId },
    });

    if (existingSong) {
      return existingSong;
    }

    // Create new song if it doesn't exist
    return await prisma.song.create({
      data: {
        ...defaultSong,
        ...overrides,
        spotifyId: overrides?.spotifyId || uniqueId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // If we hit a unique constraint error, try again with a new ID
      return createTestSong(overrides);
    }
    throw error;
  }
};

export const createTestGame = async (overrides: Partial<Game> = {}): Promise<Game> => {
  const song = await createTestSong();
  const date = getUniqueDate();

  return await prisma.game.create({
    data: {
      date,
      songId: song.id,
      ...overrides,
    },
  });
};

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTestDate(daysFromNow = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
} 