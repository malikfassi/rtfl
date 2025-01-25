import { ValidationError } from '@/app/api/lib/errors/base';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/guess';
import { TEST_IDS, TEST_SCENARIOS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
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
  const testCase = TEST_SCENARIOS.BASIC.songs[0]; // PARTY_IN_THE_USA
  const testDate = TEST_SCENARIOS.BASIC.dates[0]; // 2025-01-25
  const NONEXISTENT_ID = 'clrqm6nkw0000uy08kg9h0000'; // Valid CUID format but doesn't exist

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    service = new GuessService(context.prisma);

    // Seed the BASIC scenario
    await TEST_SCENARIOS.BASIC.seedDB(context.prisma);

    // Get the first game from our BASIC scenario (PARTY_IN_THE_USA on 2025-01-25)
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
      await expect(service.submitGuess('', TEST_IDS.PLAYER_2, testWords[0]))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess('', TEST_IDS.PLAYER_2, testWords[0]))
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
      await expect(service.submitGuess(gameId, TEST_IDS.PLAYER_2, ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.submitGuess(gameId, TEST_IDS.PLAYER_2, ''))
        .rejects
        .toThrow('Word is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.submitGuess(NONEXISTENT_ID, TEST_IDS.PLAYER_2, testWords[0]))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      await expect(service.submitGuess(gameId, TEST_IDS.PLAYER_2, 'nonexistent'))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      // Submit a guess first
      await service.submitGuess(gameId, TEST_IDS.PLAYER_2, testWords[0]);

      // Try to submit the same guess again
      await expect(service.submitGuess(gameId, TEST_IDS.PLAYER_2, testWords[0]))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('successfully submits valid guess from lyrics', async () => {
      const lyricsWord = testCase.helpers.getLyricsWords()[0];
      const guess = await service.submitGuess(gameId, TEST_IDS.PLAYER_2, lyricsWord);

      validators.unit.guess(guess);
      expect(guess).toEqual(expect.objectContaining({
        gameId,
        playerId: TEST_IDS.PLAYER_2,
        word: lyricsWord
      }));
    });

    test('successfully submits valid guess from title', async () => {
      const titleWord = testCase.helpers.getTitleWords()[0];
      const guess = await service.submitGuess(gameId, TEST_IDS.PLAYER_2, titleWord);

      validators.unit.guess(guess);
      expect(guess).toEqual(expect.objectContaining({
        gameId,
        playerId: TEST_IDS.PLAYER_2,
        word: titleWord
      }));
    });

    test('successfully submits valid guess from artist', async () => {
      const artistWord = testCase.helpers.getArtistWords()[0];
      const guess = await service.submitGuess(gameId, TEST_IDS.PLAYER_2, artistWord);

      validators.unit.guess(guess);
      expect(guess).toEqual(expect.objectContaining({
        gameId,
        playerId: TEST_IDS.PLAYER_2,
        word: artistWord
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
      await expect(service.getPlayerGuesses(NONEXISTENT_ID, TEST_IDS.PLAYER_2))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('returns empty array when no guesses found', async () => {
      const guesses = await service.getPlayerGuesses(gameId, TEST_IDS.PLAYER_2);
      expect(guesses).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      // Submit test guesses with unique words for PLAYER_2 (avoid seeded guesses)
      const uniqueWords = Array.from(new Set([
        ...testCase.helpers.getLyricsWords().slice(0, 2),
        ...testCase.helpers.getTitleWords().slice(0, 2),
        testCase.helpers.getArtistWords()[0]
      ]));
      
      // Submit each word one by one
      for (const word of uniqueWords) {
        await service.submitGuess(gameId, TEST_IDS.PLAYER_2, word);
      }

      const guesses = await service.getPlayerGuesses(gameId, TEST_IDS.PLAYER_2);

      expect(guesses).toHaveLength(uniqueWords.length);
      guesses.forEach(guess => {
        validators.unit.guess(guess);
        expect(guess).toEqual(expect.objectContaining({
          gameId,
          playerId: TEST_IDS.PLAYER_2
        }));
        expect(uniqueWords).toContain(guess.word);
      });
    });
  });
}); 