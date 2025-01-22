import { setupIntegrationTest, type IntegrationTestContext, cleanupIntegrationTest } from '@/lib/test/test-env/integration';
import { GuessService } from '../guess';
import {
  DuplicateGuessError,
  InvalidWordError,
  GameNotFoundForGuessError
} from '@/lib/errors/guess';
import { ValidationError } from '@/lib/errors/base';
import type { Game, Prisma } from '@prisma/client';
import { spotifyData } from '@/lib/test/fixtures/spotify';
import { geniusData } from '@/lib/test/fixtures/genius';
import { getLyrics, getMaskedLyrics } from '@/lib/test/fixtures/lyrics';

describe('GuessService Integration', () => {
  let context: IntegrationTestContext;
  let service: GuessService;
  let testGame: Game;
  let testWords: string[];
  const trackIds = Object.keys(spotifyData.tracks);
  const track = spotifyData.tracks[trackIds[0]];
  const query = `${track.name} ${track.artists[0].name}`;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    service = new GuessService(context.prisma);

    // Create test data in a transaction
    const result = await context.prisma.$transaction(async (tx) => {
      const lyrics = getLyrics(trackIds[0]);
      testWords = lyrics.split(/\s+/).filter(word => word.length > 0);

      // Create test song
      const song = await tx.song.create({
        data: {
          id: trackIds[0],
          spotifyId: track.id,
          lyrics,
          maskedLyrics: getMaskedLyrics(trackIds[0]) as Prisma.InputJsonValue,
          spotifyData: JSON.parse(JSON.stringify(track)) as Prisma.InputJsonValue,
          geniusData: JSON.parse(JSON.stringify(geniusData.search[query])) as Prisma.InputJsonValue
        }
      });

      // Create test game
      const game = await tx.game.create({
        data: {
          date: new Date().toISOString().split('T')[0],
          songId: song.id
        }
      });

      return { song, game };
    });

    testGame = result.game;
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
  });

  describe('submitGuess', () => {
    test('throws ValidationError when game ID is empty', async () => {
      await expect(service.submitGuess('', 'player-1', testWords[0]))
        .rejects
        .toThrow(new ValidationError('Game ID is required'));
    });

    test('throws ValidationError when player ID is empty', async () => {
      await expect(service.submitGuess(testGame.id, '', testWords[0]))
        .rejects
        .toThrow(new ValidationError('Player ID is required'));
    });

    test('throws ValidationError when word is empty', async () => {
      await expect(service.submitGuess(testGame.id, 'player-1', ''))
        .rejects
        .toThrow(new ValidationError('Word is required'));
    });

    test('throws ValidationError when word is only whitespace', async () => {
      await expect(service.submitGuess(testGame.id, 'player-1', '   '))
        .rejects
        .toThrow(new ValidationError('Word is required'));
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.submitGuess('nonexistent', 'player-1', testWords[0]))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      await expect(service.submitGuess(testGame.id, 'player-1', 'invalid'))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      // Submit first guess
      await service.submitGuess(testGame.id, 'player-1', testWords[0]);

      // Try to submit the same guess again
      await expect(service.submitGuess(testGame.id, 'player-1', testWords[0]))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('successfully submits valid guess', async () => {
      const guess = await service.submitGuess(testGame.id, 'player-1', testWords[1]);

      expect(guess).toBeDefined();
      expect(guess.word).toBe(testWords[1]);
      expect(guess.gameId).toBe(testGame.id);
      expect(guess.playerId).toBe('player-1');
      expect(guess.createdAt).toBeDefined();
    });
  });

  describe('getPlayerGuesses', () => {
    test('throws ValidationError when game ID is empty', async () => {
      await expect(service.getPlayerGuesses('', 'player-1'))
        .rejects
        .toThrow(new ValidationError('Game ID is required'));
    });

    test('throws ValidationError when player ID is empty', async () => {
      await expect(service.getPlayerGuesses(testGame.id, ''))
        .rejects
        .toThrow(new ValidationError('Player ID is required'));
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.getPlayerGuesses('nonexistent', 'player-1'))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('returns empty array when no guesses found', async () => {
      const guesses = await service.getPlayerGuesses(testGame.id, 'player-1');
      expect(guesses).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      // Submit some guesses first
      await service.submitGuess(testGame.id, 'player-1', testWords[0]);
      await service.submitGuess(testGame.id, 'player-1', testWords[1]);

      const guesses = await service.getPlayerGuesses(testGame.id, 'player-1');
      expect(guesses).toHaveLength(2);
      guesses.forEach(guess => {
        expect(guess).toMatchObject({
          gameId: testGame.id,
          playerId: 'player-1',
          word: expect.stringMatching(new RegExp(`^(${testWords[0]}|${testWords[1]})$`)),
          createdAt: expect.any(Date)
        });
      });
    });
  });
}); 