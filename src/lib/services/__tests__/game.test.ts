import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GameService } from '../game';
import { SongService } from '../song';
import { mockSpotifyTrackData, mockGeniusData } from '@/lib/test/utils';

const mockSong: {
  id: string;
  spotifyId: string;
  spotifyData: Prisma.JsonValue;
  geniusData: Prisma.JsonValue;
  lyrics: string;
  maskedLyrics: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
} = {
  id: '1',
  spotifyId: 'spotify:track:123',
  spotifyData: mockSpotifyTrackData as unknown as Prisma.JsonValue,
  geniusData: mockGeniusData as unknown as Prisma.JsonValue,
  lyrics: 'Test lyrics',
  maskedLyrics: { title: [], artist: [], lyrics: [] } as Prisma.JsonValue,
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

  describe('createOrUpdate', () => {
    it('should update an existing game with a new song, even if spotify ID is the same', async () => {
      const existingGame = {
        ...mockGame,
        song: mockSong,
      };

      const newSong = {
        ...mockSong,
        id: '2', // Different song ID but same spotify ID
      };

      const updatedGame = {
        ...mockGame,
        songId: '2',
        song: newSong,
      };

      prismaMock.game.findFirst.mockResolvedValue(existingGame);
      songServiceMock.create.mockResolvedValue(newSong);
      prismaMock.game.update.mockResolvedValue(updatedGame);

      const result = await gameService.createOrUpdate('spotify:track:123', '2025-01-17');
      expect(result).toEqual(updatedGame);

      expect(prismaMock.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' }
      });

      expect(songServiceMock.create).toHaveBeenCalledWith('spotify:track:123');

      expect(prismaMock.game.update).toHaveBeenCalledWith({
        where: { id: existingGame.id },
        data: { songId: newSong.id },
        include: { song: true }
      });
    });

    it('should create a new game if none exists for the date', async () => {
      prismaMock.game.findFirst.mockResolvedValue(null);
      songServiceMock.create.mockResolvedValue(mockSong);
      prismaMock.game.create.mockResolvedValue(mockGame);

      const result = await gameService.createOrUpdate('spotify:track:123', '2025-01-17');
      expect(result).toEqual(mockGame);

      expect(prismaMock.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' }
      });

      expect(songServiceMock.create).toHaveBeenCalledWith('spotify:track:123');

      expect(prismaMock.game.create).toHaveBeenCalledWith({
        data: {
          date: '2025-01-17',
          songId: mockSong.id
        },
        include: { song: true }
      });
    });

    it('should throw an error if date format is invalid', async () => {
      await expect(gameService.createOrUpdate('spotify:track:123', '2025/01/17'))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });
  });
}); 