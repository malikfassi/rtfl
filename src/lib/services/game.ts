import { Game, PrismaClient, Song } from '@prisma/client';
import { SongService, songService, createSongService } from './song';
import { prisma } from '../db';
import {
  GameNotFoundError,
  InvalidGameDateError,
  InvalidGameMonthError,
} from '@/lib/errors/game';
import { ValidationError } from '@/lib/errors/base';

// Type for Game with included song relation
export type GameWithSong = Game & {
  song: Song;
};

export class GameService {
  constructor(
    private songService: SongService,
    private prisma: PrismaClient
  ) {}

  private validateDateFormat(date: string): void {
    if (!date?.trim()) {
      throw new ValidationError('Invalid date format. Expected YYYY-MM-DD');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new InvalidGameDateError(date);
    }
  }

  private validateMonthFormat(month: string): void {
    if (!month?.trim()) {
      throw new ValidationError('Invalid month format. Expected YYYY-MM');
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new InvalidGameMonthError(month);
    }
  }

  async createOrUpdate(
    date: string,
    trackId: string
  ): Promise<GameWithSong> {
    if (!trackId?.trim()) {
      throw new ValidationError('Spotify ID is required');
    }

    this.validateDateFormat(date);

    // Create song first
    const song = await this.songService.create(trackId);

    // Then create or update game
    return await this.prisma.game.upsert({
      where: { date },
      update: { songId: song.id },
      create: { date, songId: song.id },
      include: { song: true }
    });
  }

  async getByDate(date: string): Promise<GameWithSong> {
    this.validateDateFormat(date);
    const game = await this.prisma.game.findUnique({
      where: { date },
      include: { song: true }
    });

    if (!game) {
      throw new GameNotFoundError(date);
    }

    return game;
  }

  async getByMonth(month: string): Promise<GameWithSong[]> {
    this.validateMonthFormat(month);
    const [year, monthStr] = month.split('-');
    const monthNum = parseInt(monthStr, 10);
    
    const firstDay = `${year}-${monthStr.padStart(2, '0')}-01`;
    const lastDay = `${year}-${monthStr.padStart(2, '0')}-${new Date(parseInt(year, 10), monthNum, 0).getDate().toString().padStart(2, '0')}`;

    return await this.prisma.game.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      include: {
        song: true
      },
      orderBy: {
        date: 'asc'
      }
    });
  }

  async delete(date: string) {
    this.validateDateFormat(date);
    const game = await this.prisma.game.findUnique({
      where: { date }
    });

    if (!game) {
      throw new GameNotFoundError(date);
    }

    await this.prisma.game.delete({
      where: { id: game.id }
    });
  }
}

// Default instance using default dependencies
export const gameService = new GameService(
  songService,
  prisma
);

// Factory function to create new instances with custom dependencies
export const createGameService = (songService: SongService = createSongService(), prismaClient: PrismaClient = prisma) => {
  return new GameService(songService, prismaClient);
}; 