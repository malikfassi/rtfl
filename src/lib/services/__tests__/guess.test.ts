import { 
  setupUnitTest,
  cleanupUnitTest,
  type UnitTestContext
} from '@/lib/test';
import { GuessService } from '../guess';
import {
  DuplicateGuessError,
  InvalidWordError,
  GameNotFoundForGuessError,
} from '@/lib/errors/guess';
import { ValidationError } from '@/lib/errors/base';
import { TEST_CASES } from '@/lib/test/fixtures/core/test_cases';

describe('GuessService', () => {
  let context: UnitTestContext;
  let service: GuessService;

  // Get test case and words from lyrics
  const validSongCase = TEST_CASES.SONGS.VALID;
  const mockGame = validSongCase.prisma.game.upsert.output('2025-01-17', '507f1f77bcf86cd799439011');
  const testWords = validSongCase.lyrics.get().toLowerCase().split(/\s+/).filter((word: string) => word.length >= 4);
  
  // Test IDs (24-character hex strings)
  const testIds = {
    GAME: '507f1f77bcf86cd799439011',
    PLAYER: '507f1f77bcf86cd799439012'
  };

  beforeEach(() => {
    context = setupUnitTest();
    service = new GuessService(context.mockPrisma);
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('submitGuess', () => {
    test('throws ValidationError when game ID is empty', async () => {
      await expect(service.submitGuess('', testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess('', testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow('Game ID is required');
    });

    test('throws ValidationError when player ID is empty', async () => {
      await expect(service.submitGuess(testIds.GAME, '', testWords[0]))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess(testIds.GAME, '', testWords[0]))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws ValidationError when word is empty', async () => {
      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, ''))
        .rejects
        .toThrow('Word is required');
    });

    test('throws ValidationError when word is only whitespace', async () => {
      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, '   '))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, '   '))
        .rejects
        .toThrow('Word is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(null);

      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue(null);

      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, 'invalid'))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue({
        id: testIds.GAME,
        gameId: testIds.GAME,
        playerId: testIds.PLAYER,
        word: testWords[0],
        createdAt: new Date()
      });

      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('throws error when create fails', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue(null);
      mockPrisma.guess.create.mockRejectedValue(new Error('DB error'));

      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow('DB error');
    });

    test('successfully creates guess', async () => {
      const { mockPrisma } = context;
      const mockGuess = {
        id: testIds.GAME,
        gameId: testIds.GAME,
        playerId: testIds.PLAYER,
        word: testWords[0],
        createdAt: new Date()
      };

      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue(null);
      mockPrisma.guess.create.mockResolvedValue(mockGuess);

      const result = await service.submitGuess(testIds.GAME, testIds.PLAYER, testWords[0]);
      expect(result).toEqual(mockGuess);
    });
  });

  describe('getPlayerGuesses', () => {
    test('throws ValidationError when game ID is empty', async () => {
      await expect(service.getPlayerGuesses('', testIds.PLAYER))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.getPlayerGuesses('', testIds.PLAYER))
        .rejects
        .toThrow('Game ID is required');
    });

    test('throws ValidationError when player ID is empty', async () => {
      await expect(service.getPlayerGuesses(testIds.GAME, ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.getPlayerGuesses(testIds.GAME, ''))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(null);

      await expect(service.getPlayerGuesses(testIds.GAME, testIds.PLAYER))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws error when query fails', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getPlayerGuesses(testIds.GAME, testIds.PLAYER))
        .rejects
        .toThrow('DB error');
    });

    test('returns empty array when no guesses found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findMany.mockResolvedValue([]);

      const result = await service.getPlayerGuesses(testIds.GAME, testIds.PLAYER);
      expect(result).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);

      const mockGuesses = [
        {
          id: testIds.GAME,
          gameId: testIds.GAME,
          playerId: testIds.PLAYER,
          word: testWords[0],
          createdAt: new Date()
        },
        {
          id: '507f1f77bcf86cd799439013',
          gameId: testIds.GAME,
          playerId: testIds.PLAYER,
          word: testWords[1],
          createdAt: new Date()
        }
      ];

      mockPrisma.guess.findMany.mockResolvedValue(mockGuesses);

      const result = await service.getPlayerGuesses(testIds.GAME, testIds.PLAYER);
      expect(result).toEqual(mockGuesses);
    });
  });
}); 