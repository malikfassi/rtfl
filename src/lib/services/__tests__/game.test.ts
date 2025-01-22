import { 
  setupUnitTest,
  cleanupUnitTest,
  type UnitTestContext
} from '@/lib/test';
import { spotifyData } from '@/lib/test/fixtures/spotify';
import { geniusData } from '@/lib/test/fixtures/genius';
import { getLyrics, getMaskedLyrics } from '@/lib/test/fixtures/lyrics';
import type { Game, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { ValidationError } from '@/lib/errors/base';
import {
  GameNotFoundError,
  InvalidGameDateError,
  InvalidGameMonthError
} from '@/lib/errors/game';
import { SongNotFoundError } from '@/lib/errors/song';

describe('GameService Unit', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('createOrUpdate', () => {
    test.each(Object.keys(spotifyData.tracks))('creates a new game with %s', async (trackId) => {
      // Arrange
      const { mockGameService, mockPrisma, mockSongService } = context;
      const date = '2025-01-17';
      const track = spotifyData.tracks[trackId];
      const query = `${track.name} ${track.artists[0].name}`;

      const song: Song = {
        id: trackId,
        spotifyId: track.id,
        spotifyData: JSON.parse(JSON.stringify(track)) as JsonValue,
        geniusData: JSON.parse(JSON.stringify(geniusData.search[query])) as JsonValue,
        lyrics: getLyrics(trackId),
        maskedLyrics: getMaskedLyrics(trackId),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(mockSongService, 'create').mockResolvedValue(song);
      mockPrisma.game.upsert.mockResolvedValue({
        id: expect.any(String),
        date,
        songId: trackId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      } as Game);

      // Act
      const game = await mockGameService.createOrUpdate(date, track.id);

      // Assert
      expect(game).toEqual({
        id: expect.any(String),
        date,
        songId: trackId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(mockSongService.create).toHaveBeenCalledWith(track.id);
    });

    test('throws ValidationError when date is empty', async () => {
      const { mockGameService } = context;
      const trackId = Object.keys(spotifyData.tracks)[0];

      await expect(mockGameService.createOrUpdate('', trackId))
        .rejects
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM-DD'));
    });

    test('throws ValidationError when date is only whitespace', async () => {
      const { mockGameService } = context;
      const trackId = Object.keys(spotifyData.tracks)[0];

      await expect(mockGameService.createOrUpdate('   ', trackId))
        .rejects
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM-DD'));
    });

    test('throws InvalidGameDateError for invalid date format', async () => {
      const { mockGameService } = context;
      const invalidDate = '2025-1-17';
      const trackId = Object.keys(spotifyData.tracks)[0];

      await expect(mockGameService.createOrUpdate(invalidDate, trackId))
        .rejects
        .toThrow(new InvalidGameDateError(invalidDate));
    });

    test('throws ValidationError when track ID is empty', async () => {
      const { mockGameService } = context;
      const date = '2025-01-17';

      await expect(mockGameService.createOrUpdate(date, ''))
        .rejects
        .toThrow(new ValidationError('Spotify ID is required'));
    });

    test('throws SongNotFoundError when song creation fails', async () => {
      const { mockGameService, mockSongService } = context;
      const date = '2025-01-17';
      const error = new SongNotFoundError();

      jest.spyOn(mockSongService, 'create').mockRejectedValue(error);

      await expect(mockGameService.createOrUpdate(date, 'nonexistent'))
        .rejects
        .toThrow(error);
    });
  });

  describe('getByDate', () => {
    test('returns game for date when found', async () => {
      const { mockGameService, mockPrisma } = context;
      const date = '2025-01-17';
      const trackId = Object.keys(spotifyData.tracks)[0];

      mockPrisma.game.findUnique.mockResolvedValue({
        id: expect.any(String),
        date,
        songId: trackId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      } as Game);

      const game = await mockGameService.getByDate(date);
      expect(game).toBeDefined();
      expect(game.date).toBe(date);
      expect(game.songId).toBe(trackId);
    });

    test('throws ValidationError when date is empty', async () => {
      const { mockGameService } = context;

      await expect(mockGameService.getByDate(''))
        .rejects
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM-DD'));
    });

    test('throws InvalidGameDateError for invalid date format', async () => {
      const { mockGameService } = context;
      const invalidDate = '2025-1-17';

      await expect(mockGameService.getByDate(invalidDate))
        .rejects
        .toThrow(new InvalidGameDateError(invalidDate));
    });

    test('throws GameNotFoundError when game does not exist', async () => {
      const { mockGameService, mockPrisma } = context;
      const date = '2025-01-17';

      mockPrisma.game.findUnique.mockResolvedValue(null);

      await expect(mockGameService.getByDate(date))
        .rejects
        .toThrow(new GameNotFoundError(date));
    });
  });

  describe('getByMonth', () => {
    test('returns games for month when found', async () => {
      // Arrange
      const { mockGameService, mockPrisma } = context;
      const month = '2025-01';
      const trackIds = Object.keys(spotifyData.tracks);
      const games = trackIds.slice(0, 2).map((trackId, index) => {
        const track = spotifyData.tracks[trackId];
        const query = `${track.name} ${track.artists[0].name}`;
        return {
          id: `game${index + 1}`,
          date: `2025-01-${17 + index}`,
          songId: trackId,
          song: {
            id: trackId,
            spotifyId: track.id,
            spotifyData: JSON.parse(JSON.stringify(track)) as JsonValue,
            geniusData: JSON.parse(JSON.stringify(geniusData.search[query])) as JsonValue,
            lyrics: getLyrics(trackId),
            maskedLyrics: getMaskedLyrics(trackId),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      mockPrisma.game.findMany.mockResolvedValue(games);

      // Act
      const result = await mockGameService.getByMonth(month);

      // Assert
      expect(result).toEqual(games);
    });

    test('returns empty array when no games for month', async () => {
      // Arrange
      const { mockGameService, mockPrisma } = context;
      const month = '2020-01';

      mockPrisma.game.findMany.mockResolvedValue([]);

      // Act
      const result = await mockGameService.getByMonth(month);

      // Assert
      expect(result).toEqual([]);
    });

    test('throws error for invalid month format', async () => {
      // Arrange
      const { mockGameService } = context;
      const invalidMonth = '2025-1';

      // Act & Assert
      await expect(mockGameService.getByMonth(invalidMonth))
        .rejects
        .toThrow(new InvalidGameMonthError(invalidMonth));
    });
  });
});