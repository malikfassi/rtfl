import { afterEach, beforeEach, describe, expect } from '@jest/globals';
import { ValidationError } from '@/app/api/lib/errors/base';
import { GameNotFoundError } from '@/app/api/lib/errors/game';
import { GameStateService } from '@/app/api/lib/services/game-state';
import { TEST_CASES, TEST_IDS, createMockGameState } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import type { GameState } from '@/app/api/lib/types/game';
import { cleanupUnitTest, setupUnitTest, type UnitTestContext } from '@/app/api/lib/test';

const testCase = TEST_CASES.SONGS.PARTY_IN_THE_USA;
const testDate = '2025-01-25';

describe('GameStateService', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('getGameState', () => {
    it('throws ValidationError when date is empty', async () => {
      const service = new GameStateService(context.mockPrisma);
      await expect(service.getGameState('', TEST_IDS.PLAYER)).rejects.toThrow(ValidationError);
    });

    it('throws GameNotFoundError when game not found', async () => {
      const service = new GameStateService(context.mockPrisma);
      context.mockPrisma.game.findUnique.mockResolvedValue(null);
      await expect(service.getGameState(testDate, TEST_IDS.PLAYER)).rejects.toThrow(GameNotFoundError);
    });

    it('throws ValidationError when player ID is empty', async () => {
      const service = new GameStateService(context.mockPrisma);
      const mockState = createMockGameState(testCase, testDate);
      context.mockPrisma.game.findUnique.mockResolvedValue(mockState);

      await expect(service.getGameState(testDate, '')).rejects.toThrow(ValidationError);
    });

    it('shows different states for different players', async () => {
      const service = new GameStateService(context.mockPrisma);
      
      // Create mock game state with no initial guesses
      const mockState = createMockGameState(testCase, testDate);
      
      // Mock game lookup
      context.mockPrisma.game.findUnique.mockResolvedValue(mockState);
      
      // Mock guesses lookup for player 1
      context.mockPrisma.guess.findMany
        .mockResolvedValueOnce(testCase.helpers.createGuesses(['party', 'in'], TEST_IDS.PLAYER, TEST_IDS.GAME))
        .mockResolvedValueOnce(testCase.helpers.createGuesses(['usa', 'the'], TEST_IDS.PLAYER_2, TEST_IDS.GAME));

      // Get game states for both players
      const player1State = await service.getGameState(testDate, TEST_IDS.PLAYER) as unknown as GameState;
      const player2State = await service.getGameState(testDate, TEST_IDS.PLAYER_2) as unknown as GameState;

      // Validate states
      validators.unit.gameState(player1State, testCase, TEST_IDS.PLAYER);
      validators.unit.gameState(player2State, testCase, TEST_IDS.PLAYER_2);
    });
  });
}); 