import { createGameService } from '../game';
import { createSongService, SongError } from '../song';
import { prisma } from '@/lib/db';
import { Game, Song } from '@prisma/client';

interface GameWithSong extends Game {
  song: Song;
}

describe('GameService Integration', () => {
  const songService = createSongService();
  const gameService = createGameService(songService);

  // Clean up the database before each test
  beforeEach(async () => {
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
  }, 10000);

  // Clean up the database after each test
  afterEach(async () => {
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
  }, 10000);

  describe('createOrUpdate', () => {
    const BAR_SONG = '2FQrifJ1N335Ljm3TjTVVf';
    const BABY_ONE_MORE_TIME = '3MjUtNVVq3C8Fn0MP3zhXa';

    it('should create a new game with a song', async () => {
      const date = '2025-01-17';
      const game = await gameService.createOrUpdate(BAR_SONG, date) as GameWithSong;

      expect(game).toBeDefined();
      expect(game.date).toBe(date);
      expect(game.song).toBeDefined();
      expect(game.song.spotifyId).toBe(BAR_SONG);
      expect(game.song.lyrics).toBeDefined();
      expect(game.song.lyrics.length).toBeGreaterThan(100);
    }, 10000);

    it('should update an existing game with a new song', async () => {
      const date = '2025-01-17';

      // Create initial game and wait for it to complete
      const initialGame = await gameService.createOrUpdate(BAR_SONG, date) as GameWithSong;
      expect(initialGame.song.spotifyId).toBe(BAR_SONG);

      // Update with new song
      const updatedGame = await gameService.createOrUpdate(BABY_ONE_MORE_TIME, date) as GameWithSong;
      expect(updatedGame.id).toBe(initialGame.id);
      expect(updatedGame.date).toBe(date);
      expect(updatedGame.song.spotifyId).toBe(BABY_ONE_MORE_TIME);
    }, 10000);

    it('should create a new song when updating with same spotify ID', async () => {
      const date = '2025-01-17';

      // Create initial game and wait for it to complete
      const initialGame = await gameService.createOrUpdate(BAR_SONG, date) as GameWithSong;

      // Try to update with same song
      const updatedGame = await gameService.createOrUpdate(BAR_SONG, date) as GameWithSong;
      expect(updatedGame.id).toBe(initialGame.id);
      expect(updatedGame.song.id).not.toBe(initialGame.song.id);
      expect(updatedGame.song.spotifyId).toBe(BAR_SONG);
    }, 10000);

    it('should throw GameError for invalid date format', async () => {
      const invalidDate = '2025-1-17';
      await expect(gameService.createOrUpdate(BAR_SONG, invalidDate))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    it('should throw SongError for non-existent track', async () => {
      const date = '2025-01-17';
      const invalidSpotifyId = 'invalid_id';
      await expect(gameService.createOrUpdate(invalidSpotifyId, date))
        .rejects
        .toThrow(SongError);
    });
  });
}); 