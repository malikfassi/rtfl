import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GameService } from '../game';
import { SongService } from '../song';

const mockGame = {
  id: '1',
  date: '2024-03-15',
  songId: '1',
  createdAt: new Date('2025-01-17T09:19:20.784Z'),
  updatedAt: new Date('2025-01-17T09:19:20.784Z'),
  song: {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    lyrics: 'Test lyrics',
    maskedLyrics: {
      title: ['Test', 'Song'],
      artist: ['Test', 'Artist'],
      lyrics: ['Test', 'lyrics']
    },
    spotifyId: 'spotify123',
    previewUrl: null,
    createdAt: new Date('2025-01-17T09:19:20.784Z'),
    updatedAt: new Date('2025-01-17T09:19:20.784Z')
  }
};

describe('GameService', () => {
  let gameService: GameService;
  let songService: DeepMockProxy<SongService>;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    songService = mockDeep<SongService>();
    gameService = new GameService(prismaMock, songService);
  });

  describe('createOrUpdate', () => {
    it('should update an existing game', async () => {
      const existingGame = {
        ...mockGame,
        song: {
          ...mockGame.song,
          id: '1',
          spotifyId: 'different-spotify-id'
        },
        songId: '1'
      };

      const updatedGame = {
        ...mockGame,
        song: {
          ...mockGame.song,
          id: '1',
          spotifyId: 'spotify123'
        },
        songId: '1'
      };

      prismaMock.game.findFirst.mockResolvedValue(existingGame);
      songService.getOrCreate.mockResolvedValue(updatedGame.song);
      prismaMock.game.update.mockResolvedValue(updatedGame);

      const result = await gameService.createOrUpdate(
        'spotify123',
        'Test Song',
        'Test Artist',
        '2024-03-15'
      );

      expect(result).toEqual(updatedGame);
      expect(songService.getOrCreate).toHaveBeenCalledWith(
        'spotify123',
        'Test Song',
        'Test Artist'
      );
      expect(prismaMock.game.update).toHaveBeenCalledWith({
        where: { id: existingGame.id },
        data: { songId: '1' },
        include: { song: true }
      });
    });

    it('should create a new game if none exists', async () => {
      const newGame = {
        ...mockGame,
        song: {
          ...mockGame.song,
          id: '1',
          spotifyId: 'spotify123'
        },
        songId: '1'
      };

      prismaMock.game.findFirst.mockResolvedValue(null);
      songService.getOrCreate.mockResolvedValue(newGame.song);
      prismaMock.game.create.mockResolvedValue(newGame);

      const result = await gameService.createOrUpdate(
        'spotify123',
        'Test Song',
        'Test Artist',
        '2024-03-15'
      );

      expect(result).toEqual(newGame);
      expect(songService.getOrCreate).toHaveBeenCalledWith(
        'spotify123',
        'Test Song',
        'Test Artist'
      );
      expect(prismaMock.game.create).toHaveBeenCalledWith({
        data: {
          date: '2024-03-15',
          songId: '1'
        },
        include: { song: true }
      });
    });

    it('should not update if game exists with same song', async () => {
      const existingGame = {
        ...mockGame,
        song: {
          ...mockGame.song,
          id: '1',
          spotifyId: 'spotify123'
        },
        songId: '1'
      };

      prismaMock.game.findFirst.mockResolvedValue(existingGame);

      const result = await gameService.createOrUpdate(
        'spotify123',
        'Test Song',
        'Test Artist',
        '2024-03-15'
      );

      expect(result).toEqual(existingGame);
      expect(songService.getOrCreate).not.toHaveBeenCalled();
      expect(prismaMock.game.update).not.toHaveBeenCalled();
    });
  });

  describe('getByDate', () => {
    it('should return a game for a given date', async () => {
      prismaMock.game.findFirst.mockResolvedValue(mockGame);
      
      const result = await gameService.getByDate('2024-03-15');
      expect(result).toEqual(mockGame);
      expect(prismaMock.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2024-03-15' },
        include: { song: true }
      });
    });

    it('should throw an error if no game is found', async () => {
      prismaMock.game.findFirst.mockResolvedValue(null);
      
      await expect(gameService.getByDate('2024-03-15')).rejects.toThrow(
        'Game not found for date: 2024-03-15'
      );
    });
  });

  describe('getByMonth', () => {
    it('should return games for a valid month', async () => {
      const games = [mockGame];
      prismaMock.game.findMany.mockResolvedValue(games);

      const result = await gameService.getByMonth('2024-03');
      expect(result).toEqual(games);
      expect(prismaMock.game.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: '2024-03-01',
            lte: '2024-03-31'
          }
        },
        orderBy: {
          date: 'asc'
        },
        include: {
          song: true
        }
      });
    });

    it('should throw an error for invalid month format', async () => {
      await expect(gameService.getByMonth('invalid')).rejects.toThrow('Invalid month format');
    });
  });
}); 