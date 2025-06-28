import { afterEach, beforeEach, describe, expect } from '@jest/globals';
import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { GameStateService } from '@/app/api/lib/services/game-state';
import { setupUnitTest, cleanupUnitTest, type UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';
import type { GameState } from '@/app/types';
import type { PrismaClient, Song, Guess } from '@prisma/client';

const testDate = '2025-01-25';

// Use valid CUIDs for player IDs
let playerId1: string;
let playerId2: string;

describe('GameStateService Unit Tests', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
    playerId1 = 'clrqm6nkw0011uy08kg9h1p4y'; // valid CUID
    playerId2 = 'clrqm6nkw0012uy08kg9h1p4z'; // valid CUID
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('getGameState', () => {
    it('throws ValidationError when date is empty', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      await expect(service.getGameState('', playerId1)).rejects.toThrow(ValidationError);
    });

    it('throws GameNotFoundError when game not found', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      (context.mockPrisma.game.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getGameState(testDate, playerId1)).rejects.toThrow(GameNotFoundError);
    });

    it('throws ValidationError for empty player ID', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const track = fixtures.spotify.tracks[key];
      const mockGame = {
        id: 'game-id',
        date: testDate,
        songId: 'song-id',
        song: {
          id: 'song-id',
          spotifyId: track.id,
          spotifyData: track as unknown as Song['spotifyData'],
          geniusData: null,
          lyrics: fixtures.genius.lyrics[key],
          maskedLyrics: fixtures.genius.maskedLyrics[key] as unknown as Song['maskedLyrics'],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Song,
        guesses: [] as Guess[],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (context.mockPrisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      await expect(service.getGameState(testDate, '')).rejects.toThrow(ValidationError);
    });

    it('shows different states for different players', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const track = fixtures.spotify.tracks[key];
      const mockGame = {
        id: 'game-id',
        date: testDate,
        songId: 'song-id',
        song: {
          id: 'song-id',
          spotifyId: track.id,
          spotifyData: track as unknown as Song['spotifyData'],
          geniusData: null,
          lyrics: fixtures.genius.lyrics[key],
          maskedLyrics: fixtures.genius.maskedLyrics[key] as unknown as Song['maskedLyrics'],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Song,
        guesses: [] as Guess[],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (context.mockPrisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      // Mock guesses for two players using mockImplementation
      (context.mockPrisma.guess.findMany as jest.Mock).mockImplementation((args: { where: { playerId: string } }) => {
        const where = args?.where || args;
        if (where && where.playerId === playerId1) {
          return Promise.resolve([
            { id: 'guess-1', gameId: 'game-id', playerId: playerId1, word: 'party', valid: true, createdAt: new Date() } as Guess,
            { id: 'guess-2', gameId: 'game-id', playerId: playerId1, word: 'in', valid: true, createdAt: new Date() } as Guess
          ]);
        }
        if (where && where.playerId === playerId2) {
          return Promise.resolve([
            { id: 'guess-3', gameId: 'game-id', playerId: playerId2, word: 'usa', valid: true, createdAt: new Date() } as Guess,
            { id: 'guess-4', gameId: 'game-id', playerId: playerId2, word: 'the', valid: true, createdAt: new Date() } as Guess
          ]);
        }
        return Promise.resolve([]);
      });
      // Get game states for both players
      const player1State = await service.getGameState(testDate, playerId1);
      const player2State = await service.getGameState(testDate, playerId2);
      // Validate states
      unit_validator.game_state_service.getGameState(key, player1State);
      unit_validator.game_state_service.getGameState(key, player2State);
    });
  });

  describe('getGameStatesByMonth', () => {
    const month = '2025-01';
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const track = fixtures.spotify.tracks[key];

    it('throws ValidationError for invalid month format', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      const invalidMonths = [
        '2024-13',  // Invalid month
        '2024-00',  // Invalid month
        '2024',     // Missing month
        '2024-1',   // Missing leading zero
        '2024-1-1', // Wrong format (date instead of month)
        'invalid',  // Completely invalid
        '',         // Empty string
      ];

      for (const invalidMonth of invalidMonths) {
        await expect(service.getGameStatesByMonth(invalidMonth, playerId1))
          .rejects.toThrow(ValidationError);
      }
    });

    it('throws ValidationError for empty player ID', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      await expect(service.getGameStatesByMonth(month, ''))
        .rejects.toThrow(ValidationError);
    });

    it('returns empty array when no games in month', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      (context.mockPrisma.game.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.getGameStatesByMonth(month, playerId1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('returns game states for month when games exist', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      const mockGames = [
        {
          id: 'game-id-1',
          date: '2025-01-25',
          masked: { title: [], artist: [], lyrics: [] },
          guesses: [
            { id: 'guess-1', gameId: 'game-id-1', playerId: playerId1, word: 'party', valid: true, createdAt: new Date() } as Guess
          ],
          song: {
            title: track.name,
            artist: track.artists[0]?.name || '',
          },
        },
        {
          id: 'game-id-2',
          date: '2025-01-26',
          masked: { title: [], artist: [], lyrics: [] },
          guesses: [],
          song: {
            title: track.name,
            artist: track.artists[0]?.name || '',
          },
        }
      ] as GameState[];
      (context.mockPrisma.game.findMany as jest.Mock).mockResolvedValue(mockGames);
      (context.mockPrisma.guess.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.getGameStatesByMonth(month, playerId1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-01-25');
      expect(result[1].date).toBe('2025-01-26');
      // Validate each game state
      result.forEach(gameState => {
        unit_validator.game_state_service.getGameState(key, gameState);
      });
    });

    it('filters games by player guesses correctly', async () => {
      const service = new GameStateService(context.mockPrisma as unknown as PrismaClient);
      const mockGames = [
        {
          id: 'game-id-1',
          date: '2025-01-25',
          masked: { title: [], artist: [], lyrics: [] },
          guesses: [
            { id: 'guess-1', gameId: 'game-id-1', playerId: playerId1, word: 'party', valid: true, createdAt: new Date() } as Guess
          ],
          song: {
            title: track.name,
            artist: track.artists[0]?.name || '',
          },
        }
      ] as GameState[];
      (context.mockPrisma.game.findMany as jest.Mock).mockResolvedValue(mockGames);
      const result = await service.getGameStatesByMonth(month, playerId1);
      expect(result).toHaveLength(1);
      expect(result[0].guesses).toHaveLength(1);
    });
  });
}); 