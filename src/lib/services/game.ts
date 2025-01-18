import { Game, PrismaClient } from '@prisma/client';
import { SongService } from './song';
import { prisma } from '../db';

export class GameError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export class GameService {
  constructor(
    private prisma: PrismaClient,
    private songService: SongService
  ) {}

  private validateDateFormat(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new GameError('Invalid date format. Expected YYYY-MM-DD', 'INVALID_FORMAT');
    }
  }

  private validateMonthFormat(month: string): void {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new GameError('Invalid month format. Expected YYYY-MM', 'INVALID_FORMAT');
    }
  }

  async createOrUpdate(
    spotifyId: string,
    date: string
  ): Promise<Game> {
    try {
      this.validateDateFormat(date);

      // Wrap game operations in a transaction
      return await this.prisma.$transaction(async (tx) => {
        // Check if game exists for this date
        const existingGame = await tx.game.findFirst({
          where: { date },
          include: { 
            song: true 
          }
        });

        // Create a new song
        const song = await this.songService.create(spotifyId, tx);

        // If game exists, update it with new song
        if (existingGame) {
          return await tx.game.update({
            where: { id: existingGame.id },
            data: { songId: song.id },
            include: { song: true }
          });
        }

        // Create a new game
        return await tx.game.create({
          data: {
            date,
            songId: song.id
          },
          include: { song: true }
        });
      }, {
        timeout: 30000 // 30 second timeout for external API calls
      });
    } catch (error) {
      console.error('Failed to create/update game:', error);
      throw error;
    }
  }

  async getByDate(date: string): Promise<Game> {
    this.validateDateFormat(date);
    const game = await this.prisma.game.findFirst({
      where: { date },
      include: { song: true }
    });

    if (!game) {
      throw new GameError(`Game not found for date: ${date}`, 'NOT_FOUND');
    }

    return game;
  }

  async getByMonth(month: string): Promise<Game[]> {
    this.validateMonthFormat(month);
    const [year, monthStr] = month.split('-');
    const monthNum = parseInt(monthStr, 10);
    
    const firstDay = `${year}-${monthStr.padStart(2, '0')}-01`;
    const lastDay = `${year}-${monthStr.padStart(2, '0')}-${new Date(parseInt(year, 10), monthNum, 0).getDate().toString().padStart(2, '0')}`;

    const games = await this.prisma.game.findMany({
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

    return games;
  }

  async delete(date: string) {
    this.validateDateFormat(date);
    const game = await this.prisma.game.findFirst({
      where: { date }
    });

    if (!game) {
      throw new GameError(`Game not found for date: ${date}`, 'NOT_FOUND');
    }

    await this.prisma.game.delete({
      where: { id: game.id }
    });
  }
}

export function createGameService(songService: SongService) {
  return new GameService(prisma, songService);
} 