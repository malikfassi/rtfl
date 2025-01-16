import { createGameService } from '../game';
import { createSongService, SongService } from '../song';
import { createTestSong, getUniqueDate } from '../../test/helpers';
import { prisma } from '../../db';

jest.mock('../song', () => ({
  createSongService: jest.fn()
}));

describe('GameService', () => {
  let mockSongService: jest.Mocked<SongService>;
  let gameService: ReturnType<typeof createGameService>;

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();

    // Create a mock song service
    mockSongService = {
      getOrCreate: jest.fn()
    } as jest.Mocked<SongService>;

    (createSongService as jest.Mock).mockReturnValue(mockSongService);
    gameService = createGameService(mockSongService);
  });

  describe('createOrUpdate', () => {
    it('should create a new game', async () => {
      const song = await createTestSong();
      const date = getUniqueDate();

      mockSongService.getOrCreate.mockResolvedValueOnce(song);
      const result = await gameService.createOrUpdate(date, song.spotifyId);

      expect(result).toBeDefined();
      expect(result.date).toBe(date);
      expect(result.songId).toBe(song.id);
      expect(typeof result.songId).toBe('string');
    });

    it('should update existing game', async () => {
      const song1 = await createTestSong();
      const song2 = await createTestSong();
      const date = getUniqueDate();

      mockSongService.getOrCreate.mockResolvedValueOnce(song1);
      await gameService.createOrUpdate(date, song1.spotifyId);

      mockSongService.getOrCreate.mockResolvedValueOnce(song2);
      const result = await gameService.createOrUpdate(date, song2.spotifyId);

      expect(result.date).toBe(date);
      expect(result.songId).toBe(song2.id);
    });
  });

  describe('getByDate', () => {
    it('should return game for given date', async () => {
      const song = await createTestSong();
      const date = getUniqueDate();

      mockSongService.getOrCreate.mockResolvedValueOnce(song);
      await gameService.createOrUpdate(date, song.spotifyId);
      const result = await gameService.getByDate(date);

      expect(result.date).toBe(date);
      expect(result.songId).toBe(song.id);
      expect(typeof result.songId).toBe('string');
    });

    it('should throw error if game not found', async () => {
      const date = getUniqueDate();
      await expect(gameService.getByDate(date)).rejects.toThrow(`NOT_FOUND: Game not found for date: ${date}`);
    });
  });

  describe('getByMonth', () => {
    it('should return games for given month', async () => {
      const song = await createTestSong();
      const date1 = getUniqueDate();
      const date2 = getUniqueDate();

      mockSongService.getOrCreate.mockResolvedValueOnce(song);
      await gameService.createOrUpdate(date1, song.spotifyId);
      mockSongService.getOrCreate.mockResolvedValueOnce(song);
      await gameService.createOrUpdate(date2, song.spotifyId);

      const result = await gameService.getByMonth('2025-01');
      expect(result).toHaveLength(2);
      result.forEach(game => {
        expect(game.songId).toBe(song.id);
        expect(typeof game.songId).toBe('string');
      });
    });

    it('should throw error for invalid month format', async () => {
      await expect(gameService.getByMonth('invalid')).rejects.toThrow('INVALID_FORMAT: Invalid month format');
    });
  });

  describe('delete', () => {
    it('should delete game for given date', async () => {
      const song = await createTestSong();
      const date = getUniqueDate();

      mockSongService.getOrCreate.mockResolvedValueOnce(song);
      await gameService.createOrUpdate(date, song.spotifyId);
      await gameService.delete(date);

      const result = await prisma.game.findUnique({ where: { date } });
      expect(result).toBeNull();
    });
  });
}); 