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
import type { Game, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';

describe('GuessService', () => {
  let context: UnitTestContext;
  let service: GuessService;
  const now = new Date();

  beforeEach(() => {
    context = setupUnitTest();
    service = new GuessService(context.mockPrisma);
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  type MockGame = Game & { song: Song };

  describe('submitGuess', () => {
    const mockGame = {
      id: 'game-1',
      date: '2025-01-17',
      songId: 'song-1',
      song: {
        id: 'song-1',
        spotifyId: 'spotify-1',
        spotifyData: {
          name: 'Test Song',
          artists: [{ name: 'Test Artist' }]
        } as JsonValue,
        geniusData: null,
        lyrics: 'test lyrics hello world',
        maskedLyrics: { title: [], artist: [], lyrics: [] } as JsonValue,
        createdAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now
    } as Game & { song: Song };

    test('throws error when game ID is empty', async () => {
      await expect(service.submitGuess('', 'player-1', 'test'))
        .rejects
        .toThrow('Game ID is required');
    });

    test('throws error when player ID is empty', async () => {
      await expect(service.submitGuess('game-1', '', 'test'))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws error when word is empty', async () => {
      await expect(service.submitGuess('game-1', 'player-1', ''))
        .rejects
        .toThrow('Word is required');
    });

    test('throws error when word is only whitespace', async () => {
      await expect(service.submitGuess('game-1', 'player-1', '   '))
        .rejects
        .toThrow('Word is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(null);

      await expect(service.submitGuess('game-1', 'player-1', 'test'))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws InvalidWordError when word not in lyrics', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue(null);

      await expect(service.submitGuess('game-1', 'player-1', 'invalid'))
        .rejects
        .toThrow(new InvalidWordError());
    });

    test('throws DuplicateGuessError when word already guessed', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue({
        id: 'guess-1',
        gameId: 'game-1',
        playerId: 'player-1',
        word: 'test',
        createdAt: now
      });

      await expect(service.submitGuess('game-1', 'player-1', 'test'))
        .rejects
        .toThrow(new DuplicateGuessError());
    });

    test('throws error when create fails', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue(null);
      mockPrisma.guess.create.mockRejectedValue(new Error('DB error'));

      await expect(service.submitGuess('game-1', 'player-1', 'test'))
        .rejects
        .toThrow('DB error');
    });

    test('successfully creates guess', async () => {
      const { mockPrisma } = context;
      const mockGuess = {
        id: 'guess-1',
        gameId: 'game-1',
        playerId: 'player-1',
        word: 'test',
        createdAt: now
      };

      mockPrisma.game.findFirst.mockResolvedValue(mockGame);
      mockPrisma.guess.findFirst.mockResolvedValue(null);
      mockPrisma.guess.create.mockResolvedValue(mockGuess);

      const result = await service.submitGuess('game-1', 'player-1', 'test');
      expect(result).toEqual(mockGuess);
    });
  });

  describe('getPlayerGuesses', () => {
    test('throws error when game ID is empty', async () => {
      await expect(service.getPlayerGuesses('', 'player-1'))
        .rejects
        .toThrow('Game ID is required');
    });

    test('throws error when player ID is empty', async () => {
      await expect(service.getPlayerGuesses('game-1', ''))
        .rejects
        .toThrow('Player ID is required');
    });

    test('throws GameNotFoundForGuessError when game not found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue(null);

      await expect(service.getPlayerGuesses('game-1', 'player-1'))
        .rejects
        .toThrow(new GameNotFoundForGuessError());
    });

    test('throws error when query fails', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue({
        id: 'game-1',
        date: '2025-01-17',
        songId: 'song-1',
        song: {
          id: 'song-1',
          spotifyId: 'spotify-1',
          spotifyData: {},
          geniusData: null,
          lyrics: 'test hello',
          maskedLyrics: { title: [], artist: [], lyrics: ['____', '_____'] },
          createdAt: now,
          updatedAt: now
        },
        createdAt: now,
        updatedAt: now
      } as MockGame);
      mockPrisma.guess.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getPlayerGuesses('game-1', 'player-1'))
        .rejects
        .toThrow('DB error');
    });

    test('returns empty array when no guesses found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue({
        id: 'game-1',
        date: '2025-01-17',
        songId: 'song-1',
        song: {
          id: 'song-1',
          spotifyId: 'spotify-1',
          spotifyData: {},
          geniusData: null,
          lyrics: 'test hello',
          maskedLyrics: { title: [], artist: [], lyrics: ['____', '_____'] },
          createdAt: now,
          updatedAt: now
        },
        createdAt: now,
        updatedAt: now
      } as MockGame);
      mockPrisma.guess.findMany.mockResolvedValue([]);

      const result = await service.getPlayerGuesses('game-1', 'player-1');
      expect(result).toEqual([]);
    });

    test('returns list of guesses when found', async () => {
      const { mockPrisma } = context;
      mockPrisma.game.findFirst.mockResolvedValue({
        id: 'game-1',
        date: '2025-01-17',
        songId: 'song-1',
        song: {
          id: 'song-1',
          spotifyId: 'spotify-1',
          spotifyData: {},
          geniusData: null,
          lyrics: 'test hello',
          maskedLyrics: { title: [], artist: [], lyrics: ['____', '_____'] },
          createdAt: now,
          updatedAt: now
        },
        createdAt: now,
        updatedAt: now
      } as MockGame);
      const mockGuesses = [
        { id: 'guess-1', gameId: 'game-1', playerId: 'player-1', word: 'test', createdAt: now },
        { id: 'guess-2', gameId: 'game-1', playerId: 'player-1', word: 'hello', createdAt: now }
      ];
      mockPrisma.guess.findMany.mockResolvedValue(mockGuesses);

      const result = await service.getPlayerGuesses('game-1', 'player-1');
      expect(result).toEqual(mockGuesses);
    });
  });
}); 