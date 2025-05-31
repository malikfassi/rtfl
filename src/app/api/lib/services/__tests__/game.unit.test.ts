import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { SongNotFoundError } from '@/app/api/lib/errors/services/song';
import { GameService } from '@/app/api/lib/services/game';
import { SongService } from '@/app/api/lib/services/song';
import { setupUnitTest, cleanupUnitTest, UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';

// Note: The linter incorrectly expects two arguments for Jest mock functions.
// These are false positives as Jest's mock functions only take one argument.
/* eslint-disable @typescript-eslint/prefer-function-type */
/* eslint-disable @typescript-eslint/unified-signatures */

describe('GameService Unit Tests', () => {
  let context: UnitTestContext;
  let service: GameService;
  let songService: SongService;

  beforeEach(() => {
    context = setupUnitTest();
    // Ensure upsert and findMany always exist on mockPrisma.game
    context.mockPrisma.game.upsert = jest.fn();
    context.mockPrisma.game.findMany = jest.fn();
    songService = new SongService(
      context.mockPrisma as any,
      context.mockSpotifyClient,
      context.mockGeniusClient as any
    );
    service = new GameService(songService, context.mockPrisma as any);
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('fixture-driven createOrUpdate', () => {
    const keys = [
      TRACK_KEYS.PARTY_IN_THE_USA,
      TRACK_KEYS.BEAT_IT,
      TRACK_KEYS.LA_VIE_EN_ROSE
    ];
    for (const key of keys) {
      it(`creates new game when none exists for ${key}`, async () => {
        const track = fixtures.spotify.tracks[key];
        const song = {
          id: 'song-id',
          spotifyId: track.id,
          spotifyData: track,
          geniusData: {
            title: fixtures.genius.search[key].response.hits[0].result.title,
            artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
            url: fixtures.genius.search[key].response.hits[0].result.url,
          },
          lyrics: fixtures.genius.lyrics[key],
          maskedLyrics: fixtures.genius.maskedLyrics[key],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        jest.spyOn(songService, 'create').mockResolvedValueOnce(song as any);
        const gameResult = {
          id: 'game-id',
          date: '2025-01-25',
          songId: song.id,
          song,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        context.mockPrisma.game.upsert.mockResolvedValueOnce(gameResult);
        const result = await service.createOrUpdate('2025-01-25', track.id);
        unit_validator.game_service.createOrUpdate(key, result);
        expect(context.mockPrisma.game.upsert).toHaveBeenCalledWith({
          where: { date: '2025-01-25' },
          create: { date: '2025-01-25', songId: song.id },
          update: { songId: song.id },
          include: { song: true }
        });
      });
    }
  });

  describe('getByDate', () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const track = fixtures.spotify.tracks[key];
    it('returns game for date', async () => {
      const song = {
        id: 'song-id',
        spotifyId: track.id,
        spotifyData: track,
        geniusData: {
          title: fixtures.genius.search[key].response.hits[0].result.title,
          artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
          url: fixtures.genius.search[key].response.hits[0].result.url,
        },
        lyrics: fixtures.genius.lyrics[key],
        maskedLyrics: fixtures.genius.maskedLyrics[key],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const gameResult = {
        id: 'game-id',
        date: '2025-01-25',
        songId: song.id,
        song,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      context.mockPrisma.game.findUnique.mockResolvedValueOnce(gameResult);
      const result = await service.getByDate('2025-01-25');
      unit_validator.game_service.getByDate(key, result);
    });
    it('throws GameNotFoundError when game not found', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValueOnce(null);
      await expect(service.getByDate('2025-01-25')).rejects.toThrow(GameNotFoundError);
    });
    it('throws ValidationError when date is empty', async () => {
      await expect(service.getByDate('')).rejects.toThrow(ValidationError);
    });
  });

  describe('getByMonth', () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const track = fixtures.spotify.tracks[key];
    it('returns games for month', async () => {
      const song = {
        id: 'song-id',
        spotifyId: track.id,
        spotifyData: track,
        geniusData: {
          title: fixtures.genius.search[key].response.hits[0].result.title,
          artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
          url: fixtures.genius.search[key].response.hits[0].result.url,
        },
        lyrics: fixtures.genius.lyrics[key],
        maskedLyrics: fixtures.genius.maskedLyrics[key],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const game1 = {
        id: 'game-id-1',
        date: '2025-01-25',
        songId: song.id,
        song,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const game2 = {
        id: 'game-id-2',
        date: '2025-01-18',
        songId: song.id,
        song,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      context.mockPrisma.game.findMany.mockResolvedValueOnce([game1, game2]);
      const result = await service.getByMonth('2025-01');
      unit_validator.game_service.getByMonth(key, result);
      expect(result).toHaveLength(2);
    });
  });
});