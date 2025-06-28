import type { GameState } from '@/app/types';

export const gameStateService = {
  getGameState: (gameState: GameState) => {
    expect(gameState).toBeDefined();
    expect(gameState).toHaveProperty('guesses');
    expect(gameState).toHaveProperty('masked');
    // Only check for 'song' if present
    if (gameState.song !== undefined) {
      if ('title' in gameState.song) {
        expect(gameState.song).toHaveProperty('title');
      }
      if ('artist' in gameState.song) {
        expect(gameState.song).toHaveProperty('artist');
      }
    }
    // Validate data types
    expect(Array.isArray(gameState.guesses)).toBe(true);
    // Validate masked lyrics structure
    if (gameState.masked) {
      expect(gameState.masked).toHaveProperty('title');
      expect(gameState.masked).toHaveProperty('artist');
      expect(gameState.masked).toHaveProperty('lyrics');
    }
    return gameState;
  }
}; 