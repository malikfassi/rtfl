import { Game, PrismaClient, Song } from '@prisma/client';
import { SongService, songService, createSongService } from './song';
import { prisma } from '../db';
import { GameNotFoundError } from '@/lib/errors/game';
import { validateSchema } from '@/lib/validation';
import { gameDateSchema, gameMonthSchema, spotifyIdSchema } from '@/lib/validation';

// Type for Game with included song relation
export type GameWithSong = Game & {
  song: Song;
};

export class GameService {
  constructor(
    private songService: SongService,
    private prisma: PrismaClient
  ) {}

  async createOrUpdate(
    date: string,
    trackId: string
  ): Promise<GameWithSong> {
    const validatedDate = validateSchema(gameDateSchema, date);
    const validatedTrackId = validateSchema(spotifyIdSchema, trackId);

    // Create song first
    const song = await this.songService.create(validatedTrackId);

    // Then create or update game
    return await this.prisma.game.upsert({
      where: { date: validatedDate },
      update: { songId: song.id },
      create: { date: validatedDate, songId: song.id },
      include: { song: true }
    });
  }

  async getByDate(date: string): Promise<GameWithSong> {
    const validatedDate = validateSchema(gameDateSchema, date);
    
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
    const validatedMonth = validateSchema(gameMonthSchema, month);
    const monthNum = parseInt(validatedMonth.split('-')[1], 10);
    const year = validatedMonth.split('-')[0];
    
    const firstDay = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
    const lastDay = `${year}-${monthNum.toString().padStart(2, '0')}-${new Date(parseInt(year, 10), monthNum, 0).getDate().toString().padStart(2, '0')}`;

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

  async delete(date: string): Promise<Game> {
    const validatedDate = validateSchema(gameDateSchema, date);
    
    const game = await this.prisma.game.findUnique({
      where: { date: validatedDate }
    });

    if (!game) {
      throw new GameNotFoundError(validatedDate);
    }

    return await this.prisma.game.delete({
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