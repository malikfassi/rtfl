import { ValidationError } from '@/app/api/lib/errors/base';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError,
} from '@/app/api/lib/errors/services/guess';
import { 
  cleanupUnitTest,
  setupUnitTest,
  type UnitTestContext
} from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';

import { GuessService } from '../guess';

// Mock gameStateService
jest.mock('@/app/api/lib/services/game-state', () => ({
  gameStateService: {
    getGameState: jest.fn()
  }
}));

// Import after mock
import { gameStateService } from '@/app/api/lib/services/game-state';

describe('GuessService', () => {
  let context: UnitTestContext;
  let service: GuessService;

  // Get test case and words from lyrics
  const validSongCase = TEST_CASES.SONGS.VALID;
  const mockGame = validSongCase.prisma.game.upsert.output('2025-01-17', 'clrqm6nkw0009uy08kg9h1p3x');
  const testWords = validSongCase.lyrics.get().toLowerCase().split(/\s+/).filter((word: string) => word.length >= 4);
  
  // Test IDs (cuid format)
  const testIds = {
    GAME: 'clrqm6nkw0009uy08kg9h1p3x',
    PLAYER: 'clrqm6nkw0010uy08kg9h1p4x'
  };

  beforeEach(() => {
    context = setupUnitTest();
    service = context.mockGuessService;
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('submitGuess', () => {
    test('throws ValidationError when game ID is empty', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);

      await expect(service.submitGuess({ date: '', userId: testIds.PLAYER, guess: testWords[0] }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: '', userId: testIds.PLAYER, guess: testWords[0] }))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    test('throws ValidationError when player ID is empty', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);

      await expect(service.submitGuess({ date: '2025-01-17', userId: '', guess: testWords[0] }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: '2025-01-17', userId: '', guess: testWords[0] }))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws ValidationError when guess is empty', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);

      await expect(service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: '' }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: '' }))
        .rejects
        .toThrow('Word is required');
    });

    test('throws ValidationError when guess is only whitespace', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);

      await expect(service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: '   ' }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: '   ' }))
        .rejects
        .toThrow('Word is required');
    });

    test('throws GameNotFoundForGuessError when game does not exist', async () => {
      const nonexistentDate = '2025-01-01';
      await expect(service.submitGuess({
        date: nonexistentDate,
        userId: testIds.PLAYER,
        guess: 'test'
      }))
      .rejects
      .toThrow(new GameNotFoundForGuessError(nonexistentDate));
    });

    test('throws InvalidWordError when guess is not in song title or artist name', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);

      await expect(service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: 'invalid' }))
        .rejects
        .toThrow(InvalidWordError);
    });

    test('throws DuplicateGuessError when guess already exists for player', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);
      context.mockPrisma.guess.findFirst.mockResolvedValue({
        id: 'existing-guess-id',
        gameId: testIds.GAME,
        playerId: testIds.PLAYER,
        word: testWords[0],
        createdAt: new Date(),
      });

      await expect(service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: testWords[0] }))
        .rejects
        .toThrow(DuplicateGuessError);
    });

    test('stores invalid guess and returns updated game state', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);
      context.mockPrisma.guess.findFirst.mockResolvedValue(null);
      
      const invalidWord = 'nonexistentword';
      const mockGuess = {
        id: testIds.GAME,
        gameId: testIds.GAME,
        playerId: testIds.PLAYER,
        word: invalidWord,
        valid: false,
        createdAt: new Date()
      };

      context.mockPrisma.guess.create.mockResolvedValue(mockGuess);

      const mockGameState = {
        id: testIds.GAME,
        date: '2025-01-17',
        masked: mockGame.song.maskedLyrics,
        guesses: [mockGuess],
        song: undefined
      };

      // Mock gameStateService.getGameState to return expected state
      (gameStateService.getGameState as jest.Mock).mockResolvedValue(mockGameState);

      const result = await service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: invalidWord });
      
      // Verify the guess was stored with valid=false
      expect(context.mockPrisma.guess.create).toHaveBeenCalledWith({
        data: {
          gameId: testIds.GAME,
          playerId: testIds.PLAYER,
          word: invalidWord.toLowerCase(),
          valid: false
        }
      });

      // Verify game state includes the invalid guess
      expect(result).toEqual(mockGameState);
    });

    test('stores valid guess with valid=true flag', async () => {
      context.mockPrisma.game.findUnique.mockResolvedValue(mockGame);
      context.mockPrisma.guess.findFirst.mockResolvedValue(null);
      
      const validWord = testWords[0];
      const mockGuess = {
        id: testIds.GAME,
        gameId: testIds.GAME,
        playerId: testIds.PLAYER,
        word: validWord,
        valid: true,
        createdAt: new Date()
      };

      context.mockPrisma.guess.create.mockResolvedValue(mockGuess);

      const mockGameState = {
        id: testIds.GAME,
        date: '2025-01-17',
        masked: mockGame.song.maskedLyrics,
        guesses: [mockGuess],
        song: undefined
      };

      // Mock gameStateService.getGameState to return expected state
      (gameStateService.getGameState as jest.Mock).mockResolvedValue(mockGameState);

      const result = await service.submitGuess({ date: '2025-01-17', userId: testIds.PLAYER, guess: validWord });
      
      // Verify the guess was stored with valid=true
      expect(context.mockPrisma.guess.create).toHaveBeenCalledWith({
        data: {
          gameId: testIds.GAME,
          playerId: testIds.PLAYER,
          word: validWord.toLowerCase(),
          valid: true
        }
      });

      // Verify game state includes the valid guess
      expect(result).toEqual(mockGameState);
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
      const nonexistentGameId = 'clrqm6nkw0000uy08nonexist';
      await expect(service.getPlayerGuesses(nonexistentGameId, testIds.PLAYER))
        .rejects
        .toThrow(new GameNotFoundForGuessError('unknown'));
    });

    test('throws error when query fails', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findUnique.mockResolvedValue(mockGame);
      mockPrisma.guess.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getPlayerGuesses(testIds.GAME, testIds.PLAYER))
        .rejects
        .toThrow('DB error');
    });

    test('returns empty array when no guesses found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findUnique.mockResolvedValue(mockGame);
      mockPrisma.guess.findMany.mockResolvedValue([]);

      const result = await service.getPlayerGuesses(testIds.GAME, testIds.PLAYER);
      expect(result).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findUnique.mockResolvedValue(mockGame);

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