import type { GameState } from '@/app/types';

export const gameStateService = {
  getGameState: (key: string, gameState: GameState) => {
    expect(gameState).toBeDefined();
    if ('song' in gameState) {
      expect(gameState).toHaveProperty('song');
    }
    expect(gameState).toHaveProperty('guesses');
    expect(gameState).toHaveProperty('masked');
    
    // Validate data types
    expect(Array.isArray(gameState.guesses)).toBe(true);
    
    return gameState;
  }
}; 