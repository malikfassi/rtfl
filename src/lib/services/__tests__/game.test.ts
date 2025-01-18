import { PrismaClient, Game, Song } from '@prisma/client';
import { GameService } from '../game';
import { SongService } from '../song';
import { mockDeep } from 'jest-mock-extended';

// Mock the Prisma client
const prismaMock = mockDeep<PrismaClient>();
const songServiceMock = mockDeep<SongService>();

describe('GameService', () => {
  let gameService: GameService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      game: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });
    gameService = new GameService(prismaMock, songServiceMock);
  });

  describe('createOrUpdate', () => {
    it('should update an existing game with a new song, even if spotify ID is the same', async () => {
      // Mock existing game
      const existingGame = {
        id: '1',
        date: '2025-01-17',
        songId: '1',
        createdAt: new Date('2025-01-17T09:19:20.784Z'),
        updatedAt: new Date('2025-01-17T09:19:20.784Z'),
        song: {
          id: '1',
          spotifyId: 'spotify:track:456',
          spotifyData: { id: 'spotify:track:1', uri: 'spotify:track:1' },
          geniusData: { id: 123, title: 'Test Song', artist_names: 'Test Artist', url: 'https://genius.com/test-song' },
          lyrics: 'Test lyrics',
          maskedLyrics: { title: [], artist: [], lyrics: [] },
          createdAt: new Date('2025-01-17T09:19:20.784Z'),
          updatedAt: new Date('2025-01-17T09:19:20.784Z'),
        },
      };

      // Mock new song with same ID structure
      const newSong = {
        id: '2',
        spotifyId: 'spotify:track:123',
        spotifyData: { id: 'spotify:track:2', uri: 'spotify:track:2' },
        geniusData: { id: 123, title: 'Test Song', artist_names: 'Test Artist', url: 'https://genius.com/test-song' },
        lyrics: 'Test lyrics',
        maskedLyrics: { title: [], artist: [], lyrics: [] },
        createdAt: new Date('2025-01-17T09:19:20.784Z'),
        updatedAt: new Date('2025-01-17T09:19:20.784Z'),
      };

      const updatedGame = {
        ...existingGame,
        songId: newSong.id,
        song: newSong,
      };

      // Mock the database calls
      mockTx.game.findFirst.mockResolvedValue(existingGame as Game & { song: Song });
      songServiceMock.create.mockResolvedValue(newSong as Song);
      mockTx.game.update.mockResolvedValue(updatedGame as Game & { song: Song });

      const result = await gameService.createOrUpdate('spotify:track:123', '2025-01-17');
      expect(result).toEqual(updatedGame);

      expect(mockTx.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' },
        include: { song: true },
      });

      expect(songServiceMock.create).toHaveBeenCalledWith('spotify:track:123', mockTx);

      expect(mockTx.game.update).toHaveBeenCalledWith({
        where: { id: existingGame.id },
        data: { songId: newSong.id },
        include: { song: true },
      });
    });

    it('should create a new game if none exists for the date', async () => {
      const mockSong = {
        id: '1',
        spotifyId: 'spotify:track:123',
        spotifyData: { id: 'spotify:track:1', uri: 'spotify:track:1' },
        geniusData: { id: 123, title: 'Test Song', artist_names: 'Test Artist' },
        lyrics: 'Test lyrics',
        maskedLyrics: { title: [], artist: [], lyrics: [] },
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

      mockTx.game.findFirst.mockResolvedValue(null);
      songServiceMock.create.mockResolvedValue(mockSong);
      mockTx.game.create.mockResolvedValue(mockGame);

      const result = await gameService.createOrUpdate('spotify:track:123', '2025-01-17');
      expect(result).toEqual(mockGame);

      expect(mockTx.game.findFirst).toHaveBeenCalledWith({
        where: { date: '2025-01-17' },
        include: { song: true }
      });

      expect(songServiceMock.create).toHaveBeenCalledWith('spotify:track:123', mockTx);

      expect(mockTx.game.create).toHaveBeenCalledWith({
        data: {
          date: '2025-01-17',
          songId: '1'
        },
        include: { song: true }
      });
    });

    it('should throw error for invalid date format', async () => {
      await expect(gameService.createOrUpdate('spotify:track:123', 'invalid-date'))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });
  });
});