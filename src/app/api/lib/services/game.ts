import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { schemas, validateSchema } from '@/app/api/lib/validation';
import type { GameWithSong, GameWithSongAndGuesses } from '@/app/api/lib/types/game';
import { ValidationError } from '@/app/api/lib/errors/base';
import { SongNotFoundError } from '@/app/api/lib/errors/services/song';

import { prisma } from '../db';
import { createSongService, SongService } from './song';

export class GameService {
  constructor(
    private songService: SongService,
    private prisma: PrismaClient
  ) {}

  async createOrUpdate(date: string, songId: string): Promise<GameWithSong> {
    const validatedDate = validateSchema(schemas.date, date);
    // Validate songId format (simple CUID check)
    if (!songId || typeof songId !== 'string' || songId.length < 20) {
      throw new ValidationError('Invalid song ID');
    }
    // Check that the song exists
    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      throw new SongNotFoundError(songId);
    }
    // Debug logging
    console.log('[GameService.createOrUpdate] Upserting game:', { validatedDate, songId });
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const game = await tx.game.upsert({
        where: { date: validatedDate },
        create: { date: validatedDate, songId },
        update: { songId },
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
    
    const startDate = new Date(Date.UTC(parseInt(year), monthNum - 1, 1));
    const endDate = new Date(Date.UTC(parseInt(year), monthNum, 0));

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

  async getGameWithGuesses(date: string, playerId: string): Promise<GameWithSongAndGuesses> {
    const validatedDate = validateSchema(schemas.date, date);
    
    const game = await this.prisma.game.findUnique({
      where: { date: validatedDate },
      include: {
        song: true,
        guesses: {
          where: { playerId },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!game?.song) {
      throw new GameNotFoundError(validatedDate);
    }

    return game as GameWithSongAndGuesses;
  }

  async getGamesWithGuesses(startDate: string, endDate: string, playerId: string): Promise<GameWithSongAndGuesses[]> {
    const validatedStartDate = validateSchema(schemas.date, startDate);
    const validatedEndDate = validateSchema(schemas.date, endDate);
    
    const games = await this.prisma.game.findMany({
      where: {
        date: {
          gte: validatedStartDate,
          lt: validatedEndDate
        }
      },
      include: {
        song: true,
        guesses: {
          where: { playerId },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { date: 'asc' }
    });

    return games.filter(game => game.song) as GameWithSongAndGuesses[];
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

export type { GameWithSong } from '@/app/api/lib/types/game'; 