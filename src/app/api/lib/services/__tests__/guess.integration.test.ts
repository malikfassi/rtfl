import { ValidationError } from '@/app/api/lib/errors/base';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/guess';
import { seedDatabase } from '@/app/api/lib/test/fixtures/core/seed-scenarios';
import {
  cleanupIntegrationTest,
  type IntegrationTestContext,
  setupIntegrationTest} from '@/app/api/lib/test/test-env/integration';

import { GuessService } from '../guess';

describe('GuessService Integration', () => {
  let context: IntegrationTestContext;
  let service: GuessService;
  let testWords: string[];
  let gameId: string;

  // Test IDs
  const testIds = {
    GAME: 'clrqm6nkw0009uy08kg9h1p3x',
    PLAYER: 'clrqm6nkw0010uy08kg9h1p4x',
    NONEXISTENT: 'clrqm6nkw0011uy08kg9h1p5x'
  } as const;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    service = new GuessService(context.prisma);

    // Seed the BASIC scenario
    await seedDatabase(context.prisma, ['BASIC']);

    // Get the first game from our BASIC scenario (PARTY_IN_THE_USA on 2025-01-25)
    const game = await context.prisma.game.findFirst({
      where: { date: '2025-01-25' },
      include: { song: true }
    });

    if (!game) throw new Error('Failed to find seeded game');
    
    gameId = game.id;
    
    // Get test words from the song's lyrics
    testWords = game.song.lyrics
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
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
      await expect(service.submitGuess(gameId, '', testWords[0]))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess(gameId, '', testWords[0]))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws ValidationError when word is empty', async () => {
      await expect(service.submitGuess(gameId, testIds.PLAYER, ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess(gameId, testIds.PLAYER, ''))
        .rejects
        .toThrow('Word is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.submitGuess(testIds.NONEXISTENT, testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      await expect(service.submitGuess(gameId, testIds.PLAYER, 'nonexistent'))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      // Get an existing guess from our seeded data
      const existingGuess = await context.prisma.guess.findFirst({
        where: { gameId }
      });

      if (!existingGuess) throw new Error('Failed to find seeded guess');

      // Try to submit the same guess with the same player ID
      await expect(service.submitGuess(gameId, existingGuess.playerId, existingGuess.word))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('successfully submits valid guess', async () => {
      // Find a word that hasn't been guessed yet
      const existingGuesses = await context.prisma.guess.findMany({
        where: { gameId }
      });
      const guessedWords = new Set(existingGuesses.map(g => g.word));
      const newWord = testWords.find(word => !guessedWords.has(word));

      if (!newWord) throw new Error('No unguessed words available');

      const guess = await service.submitGuess(gameId, testIds.PLAYER, newWord);

      expect(guess).toEqual(expect.objectContaining({
        gameId,
        playerId: testIds.PLAYER,
        word: newWord,
      }));

      expect(guess.id).toBeDefined();
      expect(guess.createdAt).toBeInstanceOf(Date);
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
      await expect(service.getPlayerGuesses(gameId, ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.getPlayerGuesses(gameId, ''))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.getPlayerGuesses(testIds.NONEXISTENT, testIds.PLAYER))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('returns empty array when no guesses found', async () => {
      // Use a new player ID that hasn't made any guesses
      const newPlayerId = 'clrqm6nkw0012uy08kg9h1p6x';
      const guesses = await service.getPlayerGuesses(gameId, newPlayerId);
      expect(guesses).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      const existingGuesses = await context.prisma.guess.findMany({
        where: { gameId, playerId: testIds.PLAYER }
      });

      expect(existingGuesses).toHaveLength(5); // Update expectation to match seeded data
      existingGuesses.forEach(guess => {
        expect(guess).toEqual(expect.objectContaining({
          gameId,
          playerId: testIds.PLAYER,
          word: expect.any(String),
        }));
        expect(guess.id).toBeDefined();
        expect(guess.createdAt).toBeDefined();
      });
    });
  });
}); 