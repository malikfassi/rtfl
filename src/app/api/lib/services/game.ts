import { PrismaClient, Prisma } from '@prisma/client';
import { createSongService, SongService } from './song';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { schemas, validateSchema } from '@/app/api/lib/validation';
import type { GameWithSong, GameWithSongAndGuesses, GameStats } from '@/app/types';
import { ValidationError } from '@/app/api/lib/errors/base';
import { SongNotFoundError } from '@/app/api/lib/errors/services/song';

import { prisma } from '../db';

export class GameService {
  constructor(
    private songService: SongService,
    private prisma: PrismaClient
  ) {}

  private async getGameStats(gameId: string): Promise<GameStats> {
    const guesses = await this.prisma.guess.findMany({
      where: { gameId }
    }) || [];

    const totalGuesses = guesses.length;
    const correctGuesses = guesses.filter(g => g.valid).length;

    // Calculate average guesses per user
    const uniqueUsers = new Set(guesses.map(g => g.playerId));
    const averageAttempts = uniqueUsers.size > 0 
      ? totalGuesses / uniqueUsers.size 
      : 0;

    // Calculate number of winners (players who found all correct words)
    // For now, treat all users with at least one correct guess as a winner (adjust logic as needed)
    const winners = new Set(guesses.filter(g => g.valid).map(g => g.playerId));
    const wins = winners.size;

    // Calculate additional stats
    const totalPlayers = uniqueUsers.size;
    const averageGuesses = totalPlayers > 0 ? totalGuesses / totalPlayers : 0;
    const totalValidGuesses = correctGuesses;
    const averageLyricsCompletionForWinners = wins > 0 ? 1.0 : 0; // Simplified calculation
    const difficultyScore = 0; // Placeholder - implement actual calculation

    return {
      totalGuesses,
      correctGuesses,
      averageAttempts,
      wins,
      totalPlayers,
      averageGuesses,
      totalValidGuesses,
      averageLyricsCompletionForWinners,
      difficultyScore
    };
  }

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
      const stats = await this.getGameStats(game.id);
      return { ...game, stats };
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

    const stats = await this.getGameStats(game.id);
    return { ...game, stats };
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

    return Promise.all(games.map(async game => {
      const stats = await this.getGameStats(game.id);
      return { ...game, stats };
    }));
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

    const stats = await this.getGameStats(game.id);
    return { ...game, stats } as GameWithSongAndGuesses;
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

    return Promise.all(games.filter(game => game.song).map(async game => {
      const stats = await this.getGameStats(game.id);
      return { ...game, stats } as GameWithSongAndGuesses;
    }));
  }
}

// Factory function to create new instances with custom dependencies
export const createGameService = (songService: SongService = createSongService(), prismaClient: PrismaClient = prisma) => {
  return new GameService(songService, prismaClient);
};

// Re-export types for backward compatibility
export type { GameWithSong, GameWithSongAndGuesses, GameStats } from '@/app/types'; 