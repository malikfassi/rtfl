import { afterEach,beforeEach, describe, expect, test } from '@jest/globals';
import { JsonValue } from '@prisma/client/runtime/library';

import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/game';
import { SongNotFoundError } from '@/app/api/lib/errors/song';
import type { GameWithSong } from '@/app/api/lib/services/game';
import { 
  cleanupUnitTest,
  setupUnitTest,
  type UnitTestContext
} from '@/app/api/lib/test';

// Get test cases
const validSongCase = {
  id: "3E7dfMvvCLUddWissuqMwr",
  prisma: {
    song: {
      create: {
        output: () => ({
          id: "3E7dfMvvCLUddWissuqMwr",
          spotifyId: "3E7dfMvvCLUddWissuqMwr",
          spotifyData: JSON.parse(JSON.stringify({ tracks: [] })) as JsonValue,
          geniusData: JSON.parse(JSON.stringify({ byId: {} })) as JsonValue,
          lyrics: "",
          maskedLyrics: JSON.parse(JSON.stringify({
            title: "M***** T****",
            artist: "A***** A****",
            lyrics: "L***** L****"
          })) as JsonValue,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    },
    game: {
      upsert: {
        input: (date: string) => ({
          where: { date },
          create: { date, songId: "3E7dfMvvCLUddWissuqMwr" },
          update: { songId: "3E7dfMvvCLUddWissuqMwr" },
          include: { song: true }
        }),
        output: (date: string) => ({
          id: "1",
          date,
          songId: "3E7dfMvvCLUddWissuqMwr",
          song: {
            id: "3E7dfMvvCLUddWissuqMwr",
            spotifyId: "3E7dfMvvCLUddWissuqMwr",
            spotifyData: JSON.parse(JSON.stringify({ tracks: [] })) as JsonValue,
            geniusData: JSON.parse(JSON.stringify({ byId: {} })) as JsonValue,
            lyrics: "",
            maskedLyrics: JSON.parse(JSON.stringify({
              title: "M***** T****",
              artist: "A***** A****",
              lyrics: "L***** L****"
            })) as JsonValue,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      findUnique: {
        output: (date: string) => ({
          id: "1",
          date,
          songId: "3E7dfMvvCLUddWissuqMwr",
          song: {
            id: "3E7dfMvvCLUddWissuqMwr",
            spotifyId: "3E7dfMvvCLUddWissuqMwr",
            spotifyData: JSON.parse(JSON.stringify({ tracks: [] })) as JsonValue,
            geniusData: JSON.parse(JSON.stringify({ byId: {} })) as JsonValue,
            lyrics: "",
            maskedLyrics: JSON.parse(JSON.stringify({
              title: "M***** T****",
              artist: "A***** A****",
              lyrics: "L***** L****"
            })) as JsonValue,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
  },
  validators: {
    unit: {
      game: (game: GameWithSong) => {
        expect(game).toBeDefined();
        expect(game.id).toBeDefined();
        expect(game.date).toBeDefined();
        expect(game.songId).toBeDefined();
        expect(game.song).toBeDefined();
      }
    }
  }
};
const testDate = '2025-01-17';

describe('Game Service', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('createOrUpdate', () => {
    describe('when song exists', () => {
      test('creates a new game with valid data', async () => {
        // Arrange
        const { mockGameService, mockPrisma, mockSongService } = context;
        const { id: songId } = validSongCase;
        const song = validSongCase.prisma.song.create.output();

        mockSongService.create.mockResolvedValueOnce(song);
        mockPrisma.game.upsert.mockResolvedValueOnce(validSongCase.prisma.game.upsert.output(testDate));

        // Act
        const result = await mockGameService.createOrUpdate(testDate, songId);

        // Assert
        validSongCase.validators.unit.game(result);
        expect(mockPrisma.game.upsert).toHaveBeenCalledWith(validSongCase.prisma.game.upsert.input(testDate));
      });

      test('updates existing game with new song', async () => {
        // Arrange
        const { mockGameService, mockPrisma, mockSongService } = context;
        const { id: songId } = validSongCase;
        const song = validSongCase.prisma.song.create.output();
        const existingGame = validSongCase.prisma.game.findUnique.output(testDate);

        // Mock existing game with different song ID
        mockPrisma.game.findUnique.mockResolvedValueOnce({
          ...existingGame,
          songId: 'different-song-id'
        });

        mockSongService.create.mockResolvedValueOnce(song);
        mockPrisma.game.upsert.mockResolvedValueOnce(validSongCase.prisma.game.upsert.output(testDate));

        // Act
        const result = await mockGameService.createOrUpdate(testDate, songId);

        // Assert
        validSongCase.validators.unit.game(result);
        expect(mockPrisma.game.upsert).toHaveBeenCalledWith(validSongCase.prisma.game.upsert.input(testDate));
      });

      test('returns existing game when song ID matches', async () => {
        // Arrange
        const { mockGameService, mockPrisma, mockSongService } = context;
        const { id: songId } = validSongCase;
        const song = validSongCase.prisma.song.create.output();
        const existingGame = validSongCase.prisma.game.findUnique.output(testDate);

        // Mock existing game with same song ID
        mockPrisma.game.findUnique.mockResolvedValueOnce(existingGame);
        mockSongService.create.mockResolvedValueOnce(song);
        mockPrisma.game.upsert.mockResolvedValueOnce(existingGame);

        // Act
        const result = await mockGameService.createOrUpdate(testDate, songId);

        // Assert
        validSongCase.validators.unit.game(result);
        expect(mockPrisma.game.upsert).toHaveBeenCalledWith(validSongCase.prisma.game.upsert.input(testDate));
        expect(mockSongService.create).toHaveBeenCalledWith(songId);
      });
    });

    describe('when validation fails', () => {
      test('throws ValidationError when date is empty', async () => {
        const { mockGameService } = context;
        const { id: songId } = validSongCase;

        await expect(mockGameService.createOrUpdate('', songId))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.createOrUpdate('', songId))
          .rejects
          .toThrow('Invalid date format. Expected YYYY-MM-DD');
      });

      test('throws ValidationError when date is only whitespace', async () => {
        const { mockGameService } = context;
        const { id: songId } = validSongCase;

        await expect(mockGameService.createOrUpdate('   ', songId))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.createOrUpdate('   ', songId))
          .rejects
          .toThrow('Invalid date format. Expected YYYY-MM-DD');
      });

      test('throws ValidationError for invalid date format', async () => {
        const { mockGameService } = context;
        const { id: songId } = validSongCase;
        const invalidDate = '2025/01/17';

        await expect(mockGameService.createOrUpdate(invalidDate, songId))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.createOrUpdate(invalidDate, songId))
          .rejects
          .toThrow('Invalid date format. Expected YYYY-MM-DD');
      });

      test('throws ValidationError when track ID is empty', async () => {
        const { mockGameService } = context;

        await expect(mockGameService.createOrUpdate(testDate, ''))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.createOrUpdate(testDate, ''))
          .rejects
          .toThrow('Spotify ID is required');
      });
    });

    describe('when song creation fails', () => {
      test('throws SongNotFoundError when track not found on Spotify', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = validSongCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects
          .toThrow(error);
      });

      test('throws SongNotFoundError when song not found on Genius', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = validSongCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects
          .toThrow(error);
      });

      test('throws SongNotFoundError when lyrics cannot be extracted', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = validSongCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects
          .toThrow(error);
      });

      test('throws SongNotFoundError when song is instrumental', async () => {
        const { mockGameService, mockSongService } = context;
        const { id: songId } = validSongCase;
        const error = new SongNotFoundError(songId);

        mockSongService.create.mockRejectedValueOnce(error);

        await expect(mockGameService.createOrUpdate(testDate, songId))
          .rejects
          .toThrow(error);
      });
    });
  });

  describe('getByDate', () => {
    describe('when game exists', () => {
      test('returns game for date', async () => {
        const { mockGameService, mockPrisma } = context;

        mockPrisma.game.findUnique.mockResolvedValueOnce(validSongCase.prisma.game.findUnique.output(testDate));

        const result = await mockGameService.getByDate(testDate);
        validSongCase.validators.unit.game(result);
      });
    });

    describe('when validation fails', () => {
      test('throws ValidationError when date is empty', async () => {
        const { mockGameService } = context;

        await expect(mockGameService.getByDate(''))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.getByDate(''))
          .rejects
          .toThrow('Invalid date format. Expected YYYY-MM-DD');
      });

      test('throws ValidationError for invalid date format', async () => {
        const { mockGameService } = context;
        const invalidDate = '2025/01/17';

        await expect(mockGameService.getByDate(invalidDate))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.getByDate(invalidDate))
          .rejects
          .toThrow('Invalid date format. Expected YYYY-MM-DD');
      });
    });

    describe('when game does not exist', () => {
      test('throws GameNotFoundError', async () => {
        const { mockGameService, mockPrisma } = context;

        mockPrisma.game.findUnique.mockResolvedValueOnce(null);

        await expect(mockGameService.getByDate(testDate))
          .rejects
          .toThrow(GameNotFoundError);
        
        await expect(mockGameService.getByDate(testDate))
          .rejects
          .toThrow(`Game not found for date: ${testDate}`);
      });
    });
  });

  describe('getByMonth', () => {
    describe('when games exist', () => {
      test('returns games for month', async () => {
        const { mockGameService, mockPrisma } = context;
        const month = '2025-01';
        const nextDate = '2025-01-18';

        const games = [
          validSongCase.prisma.game.upsert.output(testDate),
          validSongCase.prisma.game.upsert.output(nextDate)
        ];

        mockPrisma.game.findMany.mockResolvedValueOnce(games);

        const result = await mockGameService.getByMonth(month);
        expect(result).toEqual(games);
      });
    });

    describe('when no games exist', () => {
      test('returns empty array', async () => {
        const { mockGameService, mockPrisma } = context;
        const month = '2025-01';

        mockPrisma.game.findMany.mockResolvedValueOnce([]);

        const result = await mockGameService.getByMonth(month);
        expect(result).toEqual([]);
      });
    });

    describe('when validation fails', () => {
      test('throws ValidationError for invalid month format', async () => {
        const { mockGameService } = context;
        const invalidMonth = '2025/01';

        await expect(mockGameService.getByMonth(invalidMonth))
          .rejects
          .toThrow(ValidationError);
        
        await expect(mockGameService.getByMonth(invalidMonth))
          .rejects
          .toThrow('Invalid month format. Expected YYYY-MM');
      });
    });
  });
});