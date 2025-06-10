import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { setupIntegrationTest, IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { createGameService } from '../game';
import { createGuessService } from '../guess';

describe('Game Stats Integration Tests', () => {
  let context: IntegrationTestContext;
  let gameService: ReturnType<typeof createGameService>;
  let guessService: ReturnType<typeof createGuessService>;
  const date = '2024-01-01';
  const player1 = 'clrqm6nkw0011uy08kg9h1p4y';
  const player2 = 'clrqm6nkw0012uy08kg9h1p4y';
  const player3 = 'clrqm6nkw0013uy08kg9h1p4y';

  beforeEach(async () => {
    context = await setupIntegrationTest();
    gameService = createGameService(context.songService, context.prisma);
    guessService = createGuessService(context.prisma);

    // Create a game for testing
    const trackId = fixtures.spotify.tracks[TRACK_KEYS.PARTY_IN_THE_USA].id;
    const song = await context.songService.create(trackId);
    await gameService.createOrUpdate(date, song.id);
  });

  afterEach(async () => {
    await context.cleanup();
  });

  test('stats are zero when no guesses exist', async () => {
    const game = await gameService.getByDate(date);
    expect(game.stats).toEqual({
      totalGuesses: 0,
      correctGuesses: 0,
      averageAttempts: 0
    });
  });

  test('stats reflect single player with multiple guesses', async () => {
    // Player 1 makes 5 guesses, 4 correct
    await guessService.submitGuess({ date, userId: player1, guess: 'party' });
    await guessService.submitGuess({ date, userId: player1, guess: 'wrong' });
    await guessService.submitGuess({ date, userId: player1, guess: 'U' });
    await guessService.submitGuess({ date, userId: player1, guess: 'S' });
    await guessService.submitGuess({ date, userId: player1, guess: 'A' });

    const game = await gameService.getByDate(date);
    expect(game.stats.totalGuesses).toBe(5);
    expect(game.stats.correctGuesses).toBe(4);
    expect(game.stats.averageAttempts).toBe(5);
  });

  test('stats reflect multiple players with varying guesses', async () => {
    // Player 1: 3 guesses, 3 correct
    await guessService.submitGuess({ date, userId: player1, guess: 'U' });
    await guessService.submitGuess({ date, userId: player1, guess: 'S' });
    await guessService.submitGuess({ date, userId: player1, guess: 'A' });

    // Player 2: 4 guesses, 4 correct
    await guessService.submitGuess({ date, userId: player2, guess: 'party' });
    await guessService.submitGuess({ date, userId: player2, guess: 'U' });
    await guessService.submitGuess({ date, userId: player2, guess: 'S' });
    await guessService.submitGuess({ date, userId: player2, guess: 'A' });

    // Player 3: 1 guess, 1 correct
    await guessService.submitGuess({ date, userId: player3, guess: 'party' });

    const game = await gameService.getByDate(date);
    expect(game.stats.totalGuesses).toBe(8);
    expect(game.stats.correctGuesses).toBe(8);
    expect(game.stats.averageAttempts).toBeCloseTo(2.67, 2);
  });

  test('stats update correctly when guesses are added', async () => {
    // Initial state
    let game = await gameService.getByDate(date);
    expect(game.stats).toEqual({
      totalGuesses: 0,
      correctGuesses: 0,
      averageAttempts: 0
    });

    // Add first guess
    await guessService.submitGuess({ date, userId: player1, guess: 'party' });
    game = await gameService.getByDate(date);
    expect(game.stats).toEqual({
      totalGuesses: 1,
      correctGuesses: 1,
      averageAttempts: 1
    });

    // Add second guess
    await guessService.submitGuess({ date, userId: player1, guess: 'wrong' });
    game = await gameService.getByDate(date);
    expect(game.stats).toEqual({
      totalGuesses: 2,
      correctGuesses: 1,
      averageAttempts: 2
    });

    // Add third player
    await guessService.submitGuess({ date, userId: player2, guess: 'U' });
    await guessService.submitGuess({ date, userId: player2, guess: 'S' });
    await guessService.submitGuess({ date, userId: player2, guess: 'A' });
    game = await gameService.getByDate(date);
    expect(game.stats.totalGuesses).toBe(5);
    expect(game.stats.correctGuesses).toBe(4);
    expect(game.stats.averageAttempts).toBeCloseTo(2.5, 2);
  });

  test('stats handle edge cases correctly', async () => {
    // Test with very long words
    await guessService.submitGuess({ date, userId: player1, guess: 'supercalifragilisticexpialidocious' });
    await guessService.submitGuess({ date, userId: player1, guess: 'antidisestablishmentarianism' });

    // Test with accented characters
    await guessService.submitGuess({ date, userId: player2, guess: 'résumé' });
    await guessService.submitGuess({ date, userId: player2, guess: 'naïve' });

    // Test with compound words
    await guessService.submitGuess({ date, userId: player3, guess: 'party' });
    await guessService.submitGuess({ date, userId: player3, guess: 'U' });
    await guessService.submitGuess({ date, userId: player3, guess: 'S' });
    await guessService.submitGuess({ date, userId: player3, guess: 'A' });

    const game = await gameService.getByDate(date);
    expect(game.stats.totalGuesses).toBe(8);
    expect(game.stats.correctGuesses).toBe(4);
    expect(game.stats.averageAttempts).toBeCloseTo(2.67, 2);
  });
}); 