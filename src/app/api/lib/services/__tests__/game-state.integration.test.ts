import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/game';
import { TEST_IDS, SONGS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import {
  cleanupIntegrationTest,
  type IntegrationTestContext,
  setupIntegrationTest
} from '@/app/api/lib/test/test-env/integration';
import type { GameState } from '@/app/api/lib/types/game';
import { seedDatabase, TEST_SCENARIOS } from '@/app/api/lib/test/fixtures/core/seed-scenarios';
import { GameStateService } from '../game-state';

describe('GameStateService Integration', () => {
  let context: IntegrationTestContext;
  let service: GameStateService;
  let gameId: string;
  let testWords: string[];
  const testCase = SONGS.PARTY_IN_THE_USA;
  const testDate = TEST_SCENARIOS.BASIC_NO_GUESSES.dates[0]; // 2025-01-25

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    service = new GameStateService(context.prisma);

    // Seed the BASIC scenario without guesses
    await seedDatabase(context.prisma, ['BASIC_NO_GUESSES']);

    // Get the game ID and words to guess
    const game = await context.prisma.game.findFirst({
      where: { date: testDate },
      include: { song: true }
    });
    if (!game) throw new Error('Failed to find seeded game');
    gameId = game.id;
    testWords = testCase.helpers.getAllWords();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('getGameState', () => {
    test('throws ValidationError when date is empty', async () => {
      await expect(service.getGameState('', TEST_IDS.PLAYER))
        .rejects
        .toThrow(ValidationError);
    });

    test('throws GameNotFoundError when game not found', async () => {
      await expect(service.getGameState('2030-01-01', TEST_IDS.PLAYER))
        .rejects
        .toThrow(GameNotFoundError);
    });

    test('throws ValidationError when player ID is empty', async () => {
      await expect(service.getGameState(testDate, ''))
        .rejects
        .toThrow(ValidationError);
    });

    test('shows different states for different players', async () => {
      // Get existing guesses for PLAYER
      const existingGuesses = await context.prisma.guess.findMany({
        where: { gameId, playerId: TEST_IDS.PLAYER }
      });

      // Find words that haven't been guessed yet
      const existingWords = new Set(existingGuesses.map(g => g.word));
      const availableWords = testWords.filter(word => !existingWords.has(word));

      // Submit new guesses for PLAYER_2
      await context.prisma.guess.create({
        data: { gameId, playerId: TEST_IDS.PLAYER_2, word: availableWords[0] }
      });
      await context.prisma.guess.create({
        data: { gameId, playerId: TEST_IDS.PLAYER_2, word: availableWords[1] }
      });

      // Get game states for both players
      const player1State = await service.getGameState(testDate, TEST_IDS.PLAYER);
      const player2State = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

      // Validate both states using the validator
      validators.integration.gameState(player1State as GameState, testCase, TEST_IDS.PLAYER);
      validators.integration.gameState(player2State as GameState, testCase, TEST_IDS.PLAYER_2);

      // Verify that masked content is different for each player
      expect(player1State.masked).not.toEqual(player2State.masked);
    });

    test('returns game state with no guesses for new player', async () => {
      const state = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

      // Validate state using the validator - this will check masking format
      validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER_2);

      // Verify no guesses exist
      expect(state.guesses).toHaveLength(0);
    });

    describe('win conditions', () => {
      test('reveals song data when player guesses 100% of all words', async () => {
        // Get all words from lyrics, title, and artist
        const allWords = new Set([
          ...testCase.helpers.getLyricsWords(),
          ...testCase.helpers.getTitleWords(),
          ...testCase.helpers.getArtistWords()
        ]);

        // Submit all words one by one
        for (const word of allWords) {
          await context.prisma.guess.create({
            data: {
              gameId,
              playerId: TEST_IDS.PLAYER_2,
              word
            }
          });
        }

        const state = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

        // Validate state and check song data is revealed
        expect(state.song).toBeDefined();
        validators.integration.song(state.song!, testCase);
        validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER_2);
      });

      test('reveals song data when player guesses 80% of lyrics words', async () => {
        // Get lyrics words and calculate how many needed to win
        const lyricsWords = testCase.helpers.getLyricsWords();
        const wordsNeeded = Math.ceil(lyricsWords.length * 0.8);
        const wordsToSubmit = lyricsWords.slice(0, wordsNeeded);

        // Submit words one by one
        for (const word of wordsToSubmit) {
          await context.prisma.guess.create({
            data: {
              gameId,
              playerId: TEST_IDS.PLAYER_2,
              word
            }
          });
        }

        const state = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

        // Validate state and check song data is revealed
        expect(state.song).toBeDefined();
        validators.integration.song(state.song!, testCase);
        validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER_2);
      });

      test('reveals song data when player guesses all title AND artist words', async () => {
        const titleWords = testCase.helpers.getTitleWords();
        const artistWords = testCase.helpers.getArtistWords();

        // Submit all title and artist words
        const wordsToSubmit = [...titleWords, ...artistWords];
        for (const word of wordsToSubmit) {
          await context.prisma.guess.create({
            data: {
              gameId,
              playerId: TEST_IDS.PLAYER_2,
              word: word.toLowerCase() // Ensure words are lowercase
            }
          });
        }

        const state = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

        // Validate state and check song data is revealed
        expect(state.song).toBeDefined();
        validators.integration.song(state.song!, testCase);
        validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER_2);
      });

      test('does not reveal song data with only title words', async () => {
        const titleWords = testCase.helpers.getTitleWords();

        // Submit all title words
        for (const word of titleWords) {
          await context.prisma.guess.create({
            data: {
              gameId,
              playerId: TEST_IDS.PLAYER_2,
              word
            }
          });
        }

        const state = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

        // Validate state and check song data is not revealed
        validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER_2);
        expect(state.song).toBeUndefined();
      });

      test('does not reveal song data with only artist words', async () => {
        const artistWords = testCase.helpers.getArtistWords();

        // Submit all artist words
        for (const word of artistWords) {
          await context.prisma.guess.create({
            data: {
              gameId,
              playerId: TEST_IDS.PLAYER_2,
              word
            }
          });
        }

        const state = await service.getGameState(testDate, TEST_IDS.PLAYER_2);

        // Validate state and check song data is not revealed
        validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER_2);
        expect(state.song).toBeUndefined();
      });

      test('does not reveal song data with insufficient lyrics guesses', async () => {
        // Get lyrics words and submit less than 80%
        const lyricsWords = testCase.helpers.getLyricsWords();
        const insufficientWords = lyricsWords.slice(0, Math.floor(lyricsWords.length * 0.5));

        // Submit words one by one
        for (const word of insufficientWords) {
          await context.prisma.guess.create({
            data: {
              gameId,
              playerId: TEST_IDS.PLAYER,
              word
            }
          });
        }

        const state = await service.getGameState(testDate, TEST_IDS.PLAYER);

        // Validate state and check song data is not revealed
        validators.integration.gameState(state as GameState, testCase, TEST_IDS.PLAYER);
        expect(state.song).toBeUndefined();
      });
    });
  });
}); 