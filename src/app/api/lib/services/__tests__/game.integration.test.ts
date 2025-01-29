import { describe, expect, it } from '@jest/globals';

import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { SONGS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { cleanupIntegrationTest,setupIntegrationTest } from '@/app/api/lib/test/test-env/integration';

describe('GameService Integration', () => {
  const date = '2025-01-01';
  const month = '2025-01';

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('createOrUpdate', () => {
    it('creates a new game with a song', async () => {
      const { gameService } = await setupIntegrationTest();
      const game = await gameService.createOrUpdate(date, SONGS.VALID.id);
      expect(game).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String)
      }));
    });

    it('updates existing game with new song', async () => {
      const { gameService } = await setupIntegrationTest();
      await gameService.createOrUpdate(date, SONGS.VALID.id);
      const game = await gameService.createOrUpdate(date, SONGS.FRENCH.id);
      expect(game).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String)
      }));
    });

    it('throws ValidationError when date is empty', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.createOrUpdate('', SONGS.VALID.id))
        .rejects.toThrow('Invalid date format');
    });

    it('throws ValidationError when date is invalid', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.createOrUpdate('invalid-date', SONGS.VALID.id))
        .rejects.toThrow('Invalid date format');
    });

    it('throws ValidationError when trackId is empty', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.createOrUpdate(date, ''))
        .rejects.toThrow('Spotify ID is required');
    });

    it('throws ValidationError when trackId is invalid', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.createOrUpdate(date, 'invalid-id'))
        .rejects.toThrow('Invalid Spotify track ID format');
    });

    it('throws NotFoundError when track does not exist', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.createOrUpdate(date, 'spotify:track:1234567890123456789012'))
        .rejects.toThrow('Track not found');
    });
  });

  describe('getByDate', () => {
    it('returns game when found', async () => {
      const { gameService } = await setupIntegrationTest();
      await gameService.createOrUpdate(date, SONGS.VALID.id);
      const game = await gameService.getByDate(date);
      expect(game).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String),
        song: expect.objectContaining({
          spotifyId: SONGS.VALID.id
        })
      }));
    });

    it('throws GameNotFoundError when game does not exist', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.getByDate(date))
        .rejects.toThrow(GameNotFoundError);
    });

    it('throws ValidationError when date is empty', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.getByDate(''))
        .rejects.toThrow('Invalid date format');
    });

    it('throws ValidationError when date is invalid', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.getByDate('invalid-date'))
        .rejects.toThrow('Invalid date format');
    });
  });

  describe('getByMonth', () => {
    it('returns games for month when found', async () => {
      const { gameService } = await setupIntegrationTest();
      await gameService.createOrUpdate(date, SONGS.VALID.id);
      const games = await gameService.getByMonth(month);
      expect(games).toHaveLength(1);
      expect(games[0]).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String),
        song: expect.objectContaining({
          spotifyId: SONGS.VALID.id
        })
      }));
    });

    it('returns empty array when no games found', async () => {
      const { gameService } = await setupIntegrationTest();
      const games = await gameService.getByMonth(month);
      expect(games).toHaveLength(0);
    });

    it('throws ValidationError when month is empty', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.getByMonth(''))
        .rejects.toThrow('Month is required');
    });

    it('throws ValidationError when month is invalid', async () => {
      const { gameService } = await setupIntegrationTest();
      await expect(gameService.getByMonth('invalid-month'))
        .rejects.toThrow('Invalid month format');
    });
  });
}); 