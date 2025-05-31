import { afterEach, beforeEach, describe, expect } from '@jest/globals';
import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { GameStateService } from '@/app/api/lib/services/game-state';
import { setupUnitTest, cleanupUnitTest, type UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';

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
      const service = new GameStateService(context.mockPrisma as any);
      await expect(service.getGameState('', playerId1)).rejects.toThrow(ValidationError);
    });

    it('throws GameNotFoundError when game not found', async () => {
      const service = new GameStateService(context.mockPrisma as any);
      context.mockPrisma.game.findUnique.mockResolvedValue(null);
      await expect(service.getGameState(testDate, playerId1)).rejects.toThrow(GameNotFoundError);
    });

    it('throws ValidationError when player ID is empty', async () => {
      const service = new GameStateService(context.mockPrisma as any);
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const track = fixtures.spotify.tracks[key];
      const mockState = {
        id: 'game-id',
        date: testDate,
        song: {
          id: 'song-id',
          spotifyId: track.id,
          spotifyData: track,
          geniusData: {
            title: fixtures.genius.search[key].response.hits[0].result.title,
            artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
            url: fixtures.genius.search[key].response.hits[0].result.url,
          },
          lyrics: fixtures.genius.lyrics[key],
          maskedLyrics: fixtures.genius.maskedLyrics[key],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      context.mockPrisma.game.findUnique.mockResolvedValue(mockState);
      await expect(service.getGameState(testDate, '')).rejects.toThrow(ValidationError);
    });

    it('shows different states for different players', async () => {
      const service = new GameStateService(context.mockPrisma as any);
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const track = fixtures.spotify.tracks[key];
      const mockState = {
        id: 'game-id',
        date: testDate,
        song: {
          id: 'song-id',
          spotifyId: track.id,
          spotifyData: track,
          geniusData: {
            title: fixtures.genius.search[key].response.hits[0].result.title,
            artist: fixtures.genius.search[key].response.hits[0].result.primary_artist?.name || '',
            url: fixtures.genius.search[key].response.hits[0].result.url,
          },
          lyrics: fixtures.genius.lyrics[key],
          maskedLyrics: fixtures.genius.maskedLyrics[key],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        guesses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      context.mockPrisma.game.findUnique.mockResolvedValue(mockState);
      // Mock guesses for two players using mockImplementation
      context.mockPrisma.guess.findMany.mockImplementation((args) => {
        const where = args?.where || args;
        console.log('findMany called with:', where);
        if (where && where.playerId === playerId1) {
          return Promise.resolve([
            { id: 'guess-1', gameId: 'game-id', playerId: playerId1, word: 'party', valid: true, createdAt: new Date() },
            { id: 'guess-2', gameId: 'game-id', playerId: playerId1, word: 'in', valid: true, createdAt: new Date() }
          ]);
        }
        if (where && where.playerId === playerId2) {
          return Promise.resolve([
            { id: 'guess-3', gameId: 'game-id', playerId: playerId2, word: 'usa', valid: true, createdAt: new Date() },
            { id: 'guess-4', gameId: 'game-id', playerId: playerId2, word: 'the', valid: true, createdAt: new Date() }
          ]);
        }
        console.log('findMany fallback, returning []');
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
}); 