import { Game, PrismaClient } from '@prisma/client';
import { SongService } from './song';
import { prisma } from '../db';

export class GameError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(`${code}: ${message}`);
    this.name = 'GameError';
    this.code = code;
    Object.setPrototypeOf(this, GameError.prototype);
  }
}

export class GameService {
  constructor(
    private prisma: PrismaClient,
    private songService: SongService
  ) {}

  async createOrUpdate(date: string, spotifyId: string) {
    const song = await this.songService.getOrCreate(spotifyId);

    const existingGame = await this.prisma.game.findFirst({
      where: { date }
    });

    if (existingGame) {
      return this.prisma.game.update({
        where: { id: existingGame.id },
        data: { songId: song.id },
        include: { song: true }
      });
    }

    return this.prisma.game.create({
      data: {
        date,
        songId: song.id
      },
      include: { song: true }
    });
  }

  async getByDate(date: string): Promise<Game> {
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
    if (!month.match(/^\d{4}-\d{2}$/)) {
      throw new GameError('Invalid month format', 'INVALID_FORMAT');
    }

    const [year, monthStr] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthStr), 0);

    return this.prisma.game.findMany({
      where: {
        date: {
          gte: startDate.toISOString().split('T')[0],
          lte: endDate.toISOString().split('T')[0]
        }
      },
      include: { song: true },
      orderBy: { date: 'asc' }
    });
  }

  async delete(date: string) {
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