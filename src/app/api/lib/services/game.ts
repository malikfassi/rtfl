import { PrismaClient } from '@prisma/client';
import type { Game, Song, Prisma } from '@prisma/client';

import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { schemas, validateSchema } from '@/app/api/lib/validation';

import { prisma } from '../db';
import { createSongService, SongService } from './song';

// Type for Game with included song relation
export type GameWithSong = Game & {
  song: Song;
};

export class GameService {
  constructor(
    private songService: SongService,
    private prisma: PrismaClient
  ) {}

  async createOrUpdate(date: string, trackId: string): Promise<GameWithSong> {
    const validatedDate = validateSchema(schemas.date, date);
    const validatedTrackId = validateSchema(schemas.spotifyId, trackId);

    // First fetch all external data outside the transaction
    const song = await this.songService.create(validatedTrackId);

    // Then perform the database transaction
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const game = await tx.game.upsert({
        where: { date: validatedDate },
        create: { date: validatedDate, songId: song.id },
        update: { songId: song.id },
        include: { song: true }
      });

      return game;
    });
  }

  async getByDate(date: string): Promise<GameWithSong> {
    const validatedDate = validateSchema(schemas.date, date);
    
    const game = await this.prisma.game.findUnique({
      where: { date: validatedDate },
      include: { song: true }
    });

    if (!game) {
      throw new GameNotFoundError(validatedDate);
    }

    return game;
  }

  async getByMonth(month: string): Promise<GameWithSong[]> {
    const validatedMonth = validateSchema(schemas.month, month);
    const monthNum = parseInt(validatedMonth.split('-')[1], 10);
    const year = validatedMonth.split('-')[0];
    
    const startDate = new Date(parseInt(year), monthNum - 1, 1);
    const endDate = new Date(parseInt(year), monthNum, 0);

    const games = await this.prisma.game.findMany({
      where: {
        date: {
          gte: startDate.toISOString().split('T')[0],
          lte: endDate.toISOString().split('T')[0]
        }
      },
      include: { song: true },
      orderBy: { date: 'asc' }
    });

    return games;
  }

  async delete(date: string): Promise<void> {
    const validatedDate = validateSchema(schemas.date, date);
    
    const game = await this.prisma.game.findUnique({
      where: { date: validatedDate }
    });

    if (!game) {
      throw new GameNotFoundError(validatedDate);
    }

    await this.prisma.game.delete({
      where: { date: validatedDate }
    });
  }
}

// Default instance using default dependencies
export const gameService = new GameService(
  createSongService(),
  prisma
);

// Factory function to create new instances with custom dependencies
export const createGameService = (songService: SongService = createSongService(), prismaClient: PrismaClient = prisma) => {
  return new GameService(songService, prismaClient);
}; 