import { ValidationError } from '@/app/api/lib/errors/base';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/services/guess';
import { TEST_IDS, SONGS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import {
  cleanupIntegrationTest,
  type IntegrationTestContext,
  setupIntegrationTest} from '@/app/api/lib/test/test-env/integration';
import { seedDatabase, TEST_SCENARIOS } from '@/app/api/lib/test/fixtures/core/seed-scenarios';

import { GuessService } from '../guess';

describe('GuessService Integration', () => {
  let context: IntegrationTestContext;
  let service: GuessService;
  let testWords: string[];
  let gameId: string;
  const testCase = SONGS.PARTY_IN_THE_USA; // Get test case for helper functions
  const testDate = TEST_SCENARIOS.BASIC.dates[0]; // 2025-01-25
  const NONEXISTENT_ID = 'clrqm6nkw0000uy08kg9h0000'; // Valid CUID format but doesn't exist

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    service = new GuessService(context.prisma);

    // Seed the BASIC scenario without guesses
    await seedDatabase(context.prisma, ['BASIC_NO_GUESSES']);

    // Get the first game from our BASIC scenario without guesses (PARTY_IN_THE_USA on 2025-01-25)
    const game = await context.prisma.game.findFirst({
      where: { date: testDate },
      include: { song: true }
    });

    if (!game) throw new Error('Failed to find seeded game');
    gameId = game.id;
    
    // Get test words from the test case helper
    testWords = testCase.helpers.getAllWords();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('submitGuess', () => {
    test('throws ValidationError when game ID is empty', async () => {
      await expect(service.submitGuess({ date: '', userId: TEST_IDS.PLAYER_2, guess: testWords[0] }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: '', userId: TEST_IDS.PLAYER_2, guess: testWords[0] }))
        .rejects
        .toThrow('Invalid date format. Expected YYYY-MM-DD');
    });

    test('throws ValidationError when player ID is empty', async () => {
      await expect(service.submitGuess({ date: testDate, userId: '', guess: testWords[0] }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: testDate, userId: '', guess: testWords[0] }))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws ValidationError when word is empty', async () => {
      await expect(service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: '' }))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: '' }))
        .rejects
        .toThrow('Word is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      const nonexistentDate = '2025-01-01';
      await expect(service.submitGuess({
        date: nonexistentDate,
        userId: TEST_IDS.PLAYER,
        guess: 'test'
      }))
      .rejects
      .toThrow(new GameNotFoundForGuessError(nonexistentDate));
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      await expect(service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: 'nonexistent' }))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      // Submit a guess first
      await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: testWords[0] });

      // Try to submit the same guess again
      await expect(service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: testWords[0] }))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('stores invalid guess with valid=false flag', async () => {
      const invalidWord = 'nonexistentword';
      const result = await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: invalidWord });

      // Verify the guess was stored
      const storedGuesses = await service.getPlayerGuesses(result.id, TEST_IDS.PLAYER_2);
      expect(storedGuesses).toHaveLength(1);
      expect(storedGuesses[0]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: invalidWord.toLowerCase(),
        valid: false
      });

      // Verify game state includes the invalid guess
      expect(result.guesses).toHaveLength(1);
      expect(result.guesses[0]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: invalidWord.toLowerCase(),
        valid: false
      });
    });

    test('stores valid guess with valid=true flag', async () => {
      // Get a valid word from the test case
      const validWord = testCase.helpers.getLyricsWords()[0];
      const result = await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: validWord });

      // Verify the guess was stored
      const storedGuesses = await service.getPlayerGuesses(result.id, TEST_IDS.PLAYER_2);
      expect(storedGuesses).toHaveLength(1);
      expect(storedGuesses[0]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: validWord.toLowerCase(),
        valid: true
      });

      // Verify game state includes the valid guess
      expect(result.guesses).toHaveLength(1);
      expect(result.guesses[0]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: validWord.toLowerCase(),
        valid: true
      });
    });

    test('stores both valid and invalid guesses in order', async () => {
      // Submit guesses in sequence
      const invalidWord = 'nonexistentword';
      const validWord = testCase.helpers.getLyricsWords()[0];
      
      await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: invalidWord });
      const result = await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: validWord });

      // Verify both guesses were stored in order
      const storedGuesses = await service.getPlayerGuesses(result.id, TEST_IDS.PLAYER_2);
      expect(storedGuesses).toHaveLength(2);
      
      // First guess should be invalid
      expect(storedGuesses[0]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: invalidWord.toLowerCase(),
        valid: false
      });

      // Second guess should be valid
      expect(storedGuesses[1]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: validWord.toLowerCase(),
        valid: true
      });

      // Verify game state includes both guesses in order
      expect(result.guesses).toHaveLength(2);
      expect(result.guesses[0]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: invalidWord.toLowerCase(),
        valid: false
      });
      expect(result.guesses[1]).toMatchObject({
        gameId: result.id,
        playerId: TEST_IDS.PLAYER_2,
        word: validWord.toLowerCase(),
        valid: true
      });
    });

    test('successfully submits valid guess from lyrics', async () => {
      const lyricsWord = testCase.helpers.getLyricsWords()[0];
      const guess = await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: lyricsWord });

      // Validate game state
      expect(guess).toEqual(expect.objectContaining({
        id: expect.any(String),
        date: testDate,
        masked: expect.any(Object),
        guesses: expect.any(Array)
      }));
    });

    test('successfully submits valid guess from title', async () => {
      const titleWord = testCase.helpers.getTitleWords()[0];
      const guess = await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: titleWord });

      // Validate game state
      expect(guess).toEqual(expect.objectContaining({
        id: expect.any(String),
        date: testDate,
        masked: expect.any(Object),
        guesses: expect.any(Array)
      }));
    });

    test('successfully submits valid guess from artist', async () => {
      const artistWord = testCase.helpers.getArtistWords()[0];
      const guess = await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: artistWord });

      // Validate game state
      expect(guess).toEqual(expect.objectContaining({
        id: expect.any(String),
        date: testDate,
        masked: expect.any(Object),
        guesses: expect.any(Array)
      }));
    });
  });

  describe('getPlayerGuesses', () => {
    test('throws ValidationError when game ID is empty', async () => {
      await expect(service.getPlayerGuesses('', TEST_IDS.PLAYER_2))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.getPlayerGuesses('', TEST_IDS.PLAYER_2))
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
      await expect(service.getPlayerGuesses(NONEXISTENT_ID, TEST_IDS.PLAYER))
        .rejects
        .toThrow(new GameNotFoundForGuessError('unknown'));
    });

    test('returns empty array when no guesses found', async () => {
      const guesses = await service.getPlayerGuesses(gameId, TEST_IDS.PLAYER);
      expect(guesses).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      // Clear any existing guesses for this game and player
      await context.prisma.guess.deleteMany({
        where: {
          gameId,
          playerId: TEST_IDS.PLAYER_2
        }
      });

      // Get unique normalized words from different sources
      const allWords = [
        ...testCase.helpers.getLyricsWords(),
        ...testCase.helpers.getTitleWords(),
        ...testCase.helpers.getArtistWords()
      ];
      
      // Normalize words and ensure uniqueness
      const uniqueWords = Array.from(new Set(
        allWords.map(word => word.toLowerCase().trim())
      )).slice(0, 3); // Take just 3 unique words to avoid conflicts with seeded guesses
      
      // Submit each word one by one
      for (const word of uniqueWords) {
        await service.submitGuess({ date: testDate, userId: TEST_IDS.PLAYER_2, guess: word });
      }

      const guesses = await service.getPlayerGuesses(gameId, TEST_IDS.PLAYER_2);

      expect(guesses).toHaveLength(uniqueWords.length);
      guesses.forEach(guess => {
        validators.integration.guess(guess);
        expect(guess).toEqual(expect.objectContaining({
          gameId,
          playerId: TEST_IDS.PLAYER_2
        }));
        expect(uniqueWords).toContain(guess.word);
      });
    });
  });
}); 