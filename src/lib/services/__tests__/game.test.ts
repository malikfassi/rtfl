import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GameService } from '../game';
import { SongService } from '../song';

const mockSong = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  lyrics: 'Test lyrics',
  maskedLyrics: { title: [], artist: [], lyrics: [] },
  spotifyId: 'spotify:track:123',
  previewUrl: null,
  createdAt: new Date('2025-01-17T09:19:20.784Z'),
  updatedAt: new Date('2025-01-17T09:19:20.784Z'),
};

const mockGame = {
  id: '1',
  date: '2025-01-17',
  songId: '1',
  song: mockSong,
  createdAt: new Date('2025-01-17T09:19:20.784Z'),
  updatedAt: new Date('2025-01-17T09:19:20.784Z'),
};

describe('GameService', () => {
  let gameService: GameService;
  let prismaMock: DeepMockProxy<PrismaClient>;
  let songServiceMock: DeepMockProxy<SongService>;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = mockDeep<PrismaClient>();
    songServiceMock = mockDeep<SongService>();
    gameService = new GameService(prismaMock, songServiceMock);
  });

  describe('getByMonth', () => {
    it('should return games for a valid month', async () => {
      prismaMock.game.findMany.mockResolvedValue([mockGame]);

      const result = await gameService.getByMonth('2025-01');
      expect(result).toEqual([mockGame]);
      expect(prismaMock.game.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: '2025-01-01',
            lte: '2025-01-31',
          },
        },
        include: {
          song: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
    });

    it('should throw an error for invalid month format', async () => {
      await expect(gameService.getByMonth('invalid-month')).rejects.toThrow(
        'Invalid month format. Expected YYYY-MM'
      );
    });
  });

  describe('createOrUpdate', () => {
    it('should update an existing game with a new song', async () => {
      const existingGame = {
        ...mockGame,
        song: {
          ...mockSong,
          spotifyId: 'spotify:track:456',
        },
      };

      const updatedGame = {
        ...mockGame,
        song: mockSong,
      };

      prismaMock.game.findFirst.mockResolvedValue(existingGame);
      songServiceMock.getOrCreate.mockResolvedValue(mockSong);
      prismaMock.game.update.mockResolvedValue(updatedGame);

      const result = await gameService.createOrUpdate('spotify:track:123', 'Test Song', 'Test Artist', '2025-01-17');
      expect(result).toEqual(updatedGame);

      expect(prismaMock.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' },
        include: { song: true },
      });

      expect(songServiceMock.getOrCreate).toHaveBeenCalledWith('spotify:track:123', 'Test Song', 'Test Artist');

      expect(prismaMock.game.update).toHaveBeenCalledWith({
        where: { id: existingGame.id },
        data: { songId: mockSong.id },
        include: { song: true },
      });
    });

    it('should create a new game if none exists for the date', async () => {
      prismaMock.game.findFirst.mockResolvedValue(null);
      songServiceMock.getOrCreate.mockResolvedValue(mockSong);
      prismaMock.game.create.mockResolvedValue(mockGame);

      const result = await gameService.createOrUpdate('spotify:track:123', 'Test Song', 'Test Artist', '2025-01-17');
      expect(result).toEqual(mockGame);

      expect(prismaMock.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' },
        include: { song: true },
      });

      expect(songServiceMock.getOrCreate).toHaveBeenCalledWith('spotify:track:123', 'Test Song', 'Test Artist');

      expect(prismaMock.game.create).toHaveBeenCalledWith({
        data: {
          date: '2025-01-17',
          songId: mockSong.id,
        },
        include: { song: true },
      });
    });

    it('should not update if game exists with same song', async () => {
      const existingGame = {
        ...mockGame,
        song: mockSong,
      };

      prismaMock.game.findFirst.mockResolvedValue(existingGame);

      const result = await gameService.createOrUpdate('spotify:track:123', 'Test Song', 'Test Artist', '2025-01-17');
      expect(result).toEqual(existingGame);

      expect(prismaMock.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' },
        include: { song: true },
      });

      expect(songServiceMock.getOrCreate).not.toHaveBeenCalled();
      expect(prismaMock.game.update).not.toHaveBeenCalled();
    });
  });
}); 