import {
  GameNotFoundError,
  InvalidGameDateError,
  InvalidGameMonthError,
} from '@/lib/errors/game';
import { ValidationError } from '@/lib/errors/base';
import { MissingTrackIdError } from '@/lib/errors/spotify';
import { spotifyData, getLyrics, getMaskedLyrics, getMaskedTitle, getMaskedArtist } from '@/lib/test/fixtures';
import { setupIntegrationTest, type IntegrationTestContext, cleanupIntegrationTest } from '@/lib/test/test-env/integration';

describe('GameService Integration', () => {
  let context: IntegrationTestContext;

  // Get test data from fixtures
  const [TRACK_ID_1, TRACK_1] = Object.entries(spotifyData.tracks)[0];
  const [TRACK_ID_2, TRACK_2] = Object.entries(spotifyData.tracks)[1];

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
  });

  describe('createOrUpdate', () => {
    it('creates a new game with a song', async () => {
      const date = '2025-01-17';
      const trackId = TRACK_ID_1;

      const game = await context.gameService.createOrUpdate(date, trackId);

      expect(game).toBeDefined();
      expect(game.date).toBe(date);
      expect(game.song).toBeDefined();
      expect(game.song.spotifyId).toBe(trackId);
      expect(game.song.spotifyData).toMatchObject(TRACK_1);
      expect(game.song.lyrics).toBe(getLyrics(trackId));
      expect(game.song.maskedLyrics).toEqual({
        title: getMaskedTitle(trackId),
        artist: getMaskedArtist(trackId),
        lyrics: getMaskedLyrics(trackId)
      });
    });

    it('updates existing game with new song', async () => {
      const date = '2025-01-17';
      const trackId1 = TRACK_ID_1;
      const trackId2 = TRACK_ID_2;

      // Create initial game
      const game1 = await context.gameService.createOrUpdate(date, trackId1);
      expect(game1.song.spotifyId).toBe(trackId1);
      expect(game1.song.spotifyData).toMatchObject(TRACK_1);
      expect(game1.song.lyrics).toBe(getLyrics(trackId1));
      expect(game1.song.maskedLyrics).toEqual({
        title: getMaskedTitle(trackId1),
        artist: getMaskedArtist(trackId1),
        lyrics: getMaskedLyrics(trackId1)
      });

      // Update with new song
      const game2 = await context.gameService.createOrUpdate(date, trackId2);
      expect(game2.id).toBe(game1.id);
      expect(game2.song.spotifyId).toBe(trackId2);
      expect(game2.song.spotifyData).toMatchObject(TRACK_2);
      expect(game2.song.lyrics).toBe(getLyrics(trackId2));
      expect(game2.song.maskedLyrics).toEqual({
        title: getMaskedTitle(trackId2),
        artist: getMaskedArtist(trackId2),
        lyrics: getMaskedLyrics(trackId2)
      });
    });

    it('throws ValidationError when date is empty', async () => {
      await expect(context.gameService.createOrUpdate('', 'trackId'))
        .rejects
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM-DD'));
    });

    it('throws ValidationError when date is only whitespace', async () => {
      await expect(context.gameService.createOrUpdate('   ', 'trackId'))
        .rejects
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM-DD'));
    });

    it('throws InvalidGameDateError for invalid date format', async () => {
      await expect(context.gameService.createOrUpdate('invalid-date', 'trackId'))
        .rejects
        .toThrow(new InvalidGameDateError('invalid-date'));
    });

    it('throws ValidationError when track ID is empty', async () => {
      const date = '2025-01-17';
      await expect(context.gameService.createOrUpdate(date, ''))
        .rejects
        .toThrow(new ValidationError('Spotify ID is required'));
    });

    it('throws GameCreationError when song creation fails', async () => {
      const date = '2024-01-01';
      await expect(context.gameService.createOrUpdate(date, 'nonexistent'))
        .rejects
        .toThrow(new MissingTrackIdError());
    });
  });

  describe('getByDate', () => {
    it('returns game for date when found', async () => {
      const date = '2025-01-17';
      const trackId = TRACK_ID_1;

      // Create game first
      await context.gameService.createOrUpdate(date, trackId);

      // Then get it
      const game = await context.gameService.getByDate(date);
      expect(game).toBeDefined();
      expect(game.date).toBe(date);
      expect(game.song).toBeDefined();
      expect(game.song.spotifyId).toBe(trackId);
      expect(game.song.spotifyData).toMatchObject(TRACK_1);
      expect(game.song.lyrics).toBe(getLyrics(trackId));
      expect(game.song.maskedLyrics).toEqual({
        title: getMaskedTitle(trackId),
        artist: getMaskedArtist(trackId),
        lyrics: getMaskedLyrics(trackId)
      });
    });

    it('throws ValidationError when date is empty', async () => {
      await expect(context.gameService.getByDate(''))
        .rejects
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM-DD'));
    });

    it('throws InvalidGameDateError for invalid date format', async () => {
      await expect(context.gameService.getByDate('invalid-date'))
        .rejects
        .toThrow(new InvalidGameDateError('invalid-date'));
    });

    it('throws GameNotFoundError when game does not exist', async () => {
      await expect(context.gameService.getByDate('2025-01-17'))
        .rejects
        .toThrow(new GameNotFoundError('2025-01-17'));
    });
  });

  describe('getByMonth', () => {
    it('returns games for month when found', async () => {
      const trackId1 = TRACK_ID_1;
      const trackId2 = TRACK_ID_2;

      // Create games
      await context.gameService.createOrUpdate('2025-01-01', trackId1);
      await context.gameService.createOrUpdate('2025-01-02', trackId2);

      // Get games for month
      const games = await context.gameService.getByMonth('2025-01');
      expect(games).toHaveLength(2);
      expect(games[0].song.spotifyId).toBe(trackId1);
      expect(games[0].song.spotifyData).toMatchObject(TRACK_1);
      expect(games[0].song.lyrics).toBe(getLyrics(trackId1));
      expect(games[0].song.maskedLyrics).toEqual({
        title: getMaskedTitle(trackId1),
        artist: getMaskedArtist(trackId1),
        lyrics: getMaskedLyrics(trackId1)
      });
      expect(games[1].song.spotifyId).toBe(trackId2);
      expect(games[1].song.spotifyData).toMatchObject(TRACK_2);
      expect(games[1].song.lyrics).toBe(getLyrics(trackId2));
      expect(games[1].song.maskedLyrics).toEqual({
        title: getMaskedTitle(trackId2),
        artist: getMaskedArtist(trackId2),
        lyrics: getMaskedLyrics(trackId2)
      });
    });

    it('returns empty array when no games for month', async () => {
      const games = await context.gameService.getByMonth('2025-01');
      expect(games).toHaveLength(0);
    });

    it('throws error for invalid month format', async () => {
      await expect(context.gameService.getByMonth('invalid-month'))
        .rejects
        .toThrow(new InvalidGameMonthError('invalid-month'));
    });
  });
}); 