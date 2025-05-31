import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { ValidationError } from '@/app/api/lib/errors/base';
import {
  cleanupIntegrationTest,
  setupIntegrationTest,
  type IntegrationTestContext
} from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS, TRACK_URIS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';


describe('GameService Integration', () => {
  let context: IntegrationTestContext;
  const date = '2025-01-01';
  const month = '2025-01';

  beforeEach(async () => {
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('createOrUpdate', () => {
    it('creates a new game with a song', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackUri = TRACK_URIS[key];
      const trackId = trackUri.split(':').pop()!;
      const song = await context.songService.create(trackId);
      const game = await context.gameService.createOrUpdate(date, song.id);
      integration_validator.game_service.createOrUpdate(game);
      expect(game).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String)
      }));
    });

    it('updates existing game with new song', async () => {
      const key1 = TRACK_KEYS.PARTY_IN_THE_USA;
      const key2 = TRACK_KEYS.LA_VIE_EN_ROSE;
      const trackId1 = TRACK_URIS[key1].split(':').pop()!;
      const trackId2 = TRACK_URIS[key2].split(':').pop()!;
      const song1 = await context.songService.create(trackId1);
      const song2 = await context.songService.create(trackId2);
      await context.gameService.createOrUpdate(date, song1.id);
      const game = await context.gameService.createOrUpdate(date, song2.id);
      integration_validator.game_service.createOrUpdate(game);
      expect(game).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String)
      }));
    });

    it('throws ValidationError when date is empty', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackId = TRACK_URIS[key].split(':').pop()!;
      await expect(context.gameService.createOrUpdate('', trackId))
        .rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when date is invalid', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackId = TRACK_URIS[key].split(':').pop()!;
      await expect(context.gameService.createOrUpdate('invalid-date', trackId))
        .rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when trackId is empty', async () => {
      await expect(context.songService.create(''))
        .rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when trackId is invalid', async () => {
      await expect(context.songService.create('invalid-id'))
        .rejects.toThrow(ValidationError);
    });

    it('throws SongNotFoundError when track does not exist', async () => {
      const key = TRACK_KEYS.NOT_FOUND;
      const trackId = TRACK_URIS[key].split(':').pop()!;
      await expect(context.songService.create(trackId))
        .rejects.toThrow('Track not found');
    });
  });

  describe('getByDate', () => {
    it('returns game when found', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackId = TRACK_URIS[key].split(':').pop()!;
      const song = await context.songService.create(trackId);
      await context.gameService.createOrUpdate(date, song.id);
      const game = await context.gameService.getByDate(date);
      integration_validator.game_service.getByDate(game);
      expect(game).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String),
        song: expect.objectContaining({
          spotifyId: trackId
        })
      }));
    });

    it('throws GameNotFoundError when game does not exist', async () => {
      await expect(context.gameService.getByDate(date))
        .rejects.toThrow(GameNotFoundError);
    });

    it('throws ValidationError when date is empty', async () => {
      await expect(context.gameService.getByDate(''))
        .rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when date is invalid', async () => {
      await expect(context.gameService.getByDate('invalid-date'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getByMonth', () => {
    it('returns games for month when found', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackId = TRACK_URIS[key].split(':').pop()!;
      const song = await context.songService.create(trackId);
      await context.gameService.createOrUpdate(date, song.id);
      const games = await context.gameService.getByMonth(month);
      integration_validator.game_service.getByMonth(games);
      expect(games).toHaveLength(1);
      expect(games[0]).toEqual(expect.objectContaining({
        date,
        songId: expect.any(String),
        song: expect.objectContaining({
          spotifyId: trackId
        })
      }));
    });

    it('returns empty array when no games found', async () => {
      const games = await context.gameService.getByMonth(month);
      expect(games).toHaveLength(0);
    });

    it('throws ValidationError when month is empty', async () => {
      await expect(context.gameService.getByMonth(''))
        .rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when month is invalid', async () => {
      await expect(context.gameService.getByMonth('invalid-month'))
        .rejects.toThrow(ValidationError);
    });
  });
}); 