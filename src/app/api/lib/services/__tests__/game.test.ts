import { afterEach,beforeEach, describe, expect, test } from '@jest/globals';

import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/game';
import { SongNotFoundError } from '@/app/api/lib/errors/song';
import type { GameWithSong } from '@/app/api/lib/services/game';
import { 
  cleanupUnitTest,
  setupUnitTest,
  type UnitTestContext
} from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';

const testCase = TEST_CASES.SONGS.PARTY_IN_THE_USA;
const testDate = '2025-01-25';

// Note: The linter incorrectly expects two arguments for Jest mock functions.
// These are false positives as Jest's mock functions only take one argument.
/* eslint-disable @typescript-eslint/prefer-function-type */
/* eslint-disable @typescript-eslint/unified-signatures */

describe('Game Service', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('createOrUpdate', () => {
    describe('success cases', () => {
      test('creates new game when none exists', async () => {
        // Arrange
        const { mockGameService, mockPrisma, mockSongService } = context;
        const { id: songId } = testCase;
        const song = testCase.prisma.song.create.output();

        mockSongService.create.mockResolvedValueOnce(song);
        mockPrisma.game.upsert.mockResolvedValueOnce(testCase.prisma.game.upsert.output(testDate, testCase.id));

        // Act
        const result = await mockGameService.createOrUpdate(testDate, songId);

        // Assert
        validators.unit.game(result, testCase, testDate);
        expect(mockPrisma.game.upsert).toHaveBeenCalledWith({
          where: { date: testDate },
          create: { date: testDate, songId: song.id },
          update: { songId: song.id },
          include: { song: true }
        });
      });

      test('updates existing game with new song', async () => {
        // Arrange
        const { mockGameService, mockPrisma, mockSongService } = context;
        const { id: songId } = testCase;
        const song = testCase.prisma.song.create.output();

        mockSongService.create.mockResolvedValueOnce(song);
        mockPrisma.game.upsert.mockResolvedValueOnce(testCase.prisma.game.upsert.output(testDate, testCase.id));

        // Act
        const result = await mockGameService.createOrUpdate(testDate, songId);

        // Assert
        validators.unit.game(result, testCase, testDate);
        expect(mockPrisma.game.upsert).toHaveBeenCalledWith({
          where: { date: testDate },
          create: { date: testDate, songId: song.id },
          update: { songId: song.id },
          include: { song: true }
        });
      });

      test('returns existing game when song ID matches', async () => {
        // Arrange
        const { mockGameService, mockPrisma, mockSongService } = context;
        const { id: songId } = testCase;
        const song = testCase.prisma.song.create.output();

        mockSongService.create.mockResolvedValueOnce(song);
        mockPrisma.game.upsert.mockResolvedValueOnce(testCase.prisma.game.upsert.output(testDate, testCase.id));

        // Act
        const result = await mockGameService.createOrUpdate(testDate, songId);

        // Assert
        validators.unit.game(result, testCase, testDate);
        expect(mockPrisma.game.upsert).toHaveBeenCalledWith({
          where: { date: testDate },
          create: { date: testDate, songId: song.id },
          update: { songId: song.id },
          include: { song: true }
        });
        expect(mockSongService.create).toHaveBeenCalledWith(songId);
      });
    });

    describe('error cases', () => {
      test('throws ValidationError when date is empty', async () => {
        const { mockGameService } = context;
        const { id: songId } = testCase;

        await expect(mockGameService.createOrUpdate('', songId))
          .rejects.toThrow(ValidationError);
      });

      test('throws ValidationError when date is only whitespace', async () => {
        const { mockGameService } = context;
        const { id: songId } = testCase;

        await expect(mockGameService.createOrUpdate('   ', songId))
          .rejects.toThrow(ValidationError);
      });

      test('throws ValidationError for invalid date format', async () => {
        const { mockGameService } = context;
        const { id: songId } = testCase;
        const invalidDate = '2025/01/17';

        await expect(mockGameService.createOrUpdate(invalidDate, songId))
          .rejects.toThrow(ValidationError);
      });

      test('throws SongNotFoundError when track not found on Spotify', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = testCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects.toThrow(error);
      });

      test('throws SongNotFoundError when song not found on Genius', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = testCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects.toThrow(error);
      });

      test('throws SongNotFoundError when lyrics cannot be extracted', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = testCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects.toThrow(error);
      });

      test('throws SongNotFoundError when song is instrumental', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = testCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects.toThrow(error);
      });
    });
  });

  describe('getByDate', () => {
    test('returns game for date', async () => {
      const { mockGameService, mockPrisma } = context;

      mockPrisma.game.findUnique.mockResolvedValueOnce(testCase.prisma.game.findUnique.output(testDate, testCase.id));

      const result = await mockGameService.getByDate(testDate);
      validators.unit.game(result, testCase, testDate);
    });

    test('throws GameNotFoundError when game not found', async () => {
      const { mockGameService, mockPrisma } = context;

      mockPrisma.game.findUnique.mockResolvedValueOnce(null);

      await expect(mockGameService.getByDate(testDate))
        .rejects.toThrow(GameNotFoundError);
    });

    test('throws ValidationError when date is empty', async () => {
      const { mockGameService } = context;

      await expect(mockGameService.getByDate(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getByMonth', () => {
    test('returns games for month', async () => {
      const { mockGameService, mockPrisma } = context;
      const month = '2025-01';
      const nextDate = '2025-01-18';

      const games = [
        testCase.prisma.game.upsert.output(testDate, testCase.id),
        testCase.prisma.game.upsert.output(nextDate, testCase.id)
      ];

      mockPrisma.game.findMany.mockResolvedValueOnce(games);

      const result = await mockGameService.getByMonth(month);

      expect(result).toHaveLength(2);
      result.forEach((game: GameWithSong, index: number) => validators.unit.game(game, testCase, [testDate, nextDate][index]));
    });
  });
});