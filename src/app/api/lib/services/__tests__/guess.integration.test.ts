import type { Prisma } from '@prisma/client';

import { ValidationError } from '@/app/api/lib/errors/base';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/guess';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import {
  cleanupIntegrationTest,
  type IntegrationTestContext,
  setupIntegrationTest} from '@/app/api/lib/test/test-env/integration';

import { GuessService } from '../guess';

describe('GuessService Integration', () => {
  let context: IntegrationTestContext;
  let service: GuessService;
  let testWords: string[];

  // Test IDs (24-character hex strings)
  const testIds = {
    GAME: '507f1f77bcf86cd799439011',
    PLAYER: '507f1f77bcf86cd799439012',
    NONEXISTENT: '507f1f77bcf86cd799439013'
  };

  // Get test case
  const validSongCase = TEST_CASES.SONGS.VALID;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    service = new GuessService(context.prisma);

    // Create test data in a transaction
    await context.prisma.$transaction(async (tx) => {
      // Create test song with default ID
      const songData = validSongCase.prisma.song.create.input();
      const song = await tx.song.create({
        data: {
          spotifyId: songData.data.spotifyId,
          spotifyData: songData.data.spotifyData as Prisma.InputJsonValue,
          geniusData: songData.data.geniusData as Prisma.InputJsonValue,
          lyrics: songData.data.lyrics,
          maskedLyrics: songData.data.maskedLyrics as Prisma.InputJsonValue
        }
      });

      // Get test words from lyrics
      testWords = song.lyrics
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Filter out short words

      // Create test game with specific ID
      await tx.game.create({
        data: {
          id: testIds.GAME,
          date: new Date().toISOString().split('T')[0],
          songId: song.id
        }
      });
    });
  });

  afterEach(async () => {
    // Cleanup test context and database
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

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.submitGuess(testIds.NONEXISTENT, testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, 'nonexistent'))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      // Submit first guess
      await context.prisma.guess.create({ 
        data: {
          gameId: testIds.GAME,
          playerId: testIds.PLAYER,
          word: testWords[0]
        }
      });

      // Try to submit the same guess again
      await expect(service.submitGuess(testIds.GAME, testIds.PLAYER, testWords[0]))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('successfully submits valid guess', async () => {
      const guess = await service.submitGuess(testIds.GAME, testIds.PLAYER, testWords[1]);

      expect(guess).toEqual(expect.objectContaining({
        gameId: testIds.GAME,
        playerId: testIds.PLAYER,
        word: testWords[1],
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
      await expect(service.getPlayerGuesses(testIds.GAME, ''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(service.getPlayerGuesses(testIds.GAME, ''))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      await expect(service.getPlayerGuesses(testIds.NONEXISTENT, testIds.PLAYER))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('returns empty array when no guesses found', async () => {
      const guesses = await service.getPlayerGuesses(testIds.GAME, testIds.PLAYER);
      expect(guesses).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      // Submit some guesses first
      await context.prisma.guess.createMany({
        data: [
          {
            gameId: testIds.GAME,
            playerId: testIds.PLAYER,
            word: testWords[0]
          },
          {
            gameId: testIds.GAME,
            playerId: testIds.PLAYER,
            word: testWords[1]
          }
        ]
      });

      const guesses = await service.getPlayerGuesses(testIds.GAME, testIds.PLAYER);
      expect(guesses).toHaveLength(2);
      guesses.forEach(guess => {
        expect(guess).toEqual(expect.objectContaining({
          gameId: testIds.GAME,
          playerId: testIds.PLAYER,
          word: expect.stringMatching(new RegExp(`^(${testWords[0]}|${testWords[1]})$`)),
        }));
        expect(guess.id).toBeDefined();
        expect(guess.createdAt).toBeInstanceOf(Date);
      });
    });
  });
}); 