export const gameStateService = {
  getGameState: (gameState: any) => {
    expect(gameState).toBeDefined();
    expect(gameState).toHaveProperty('guesses');
    expect(gameState).toHaveProperty('masked');
    // Only check for 'song' if present
    if (gameState.song !== undefined) {
      expect(gameState.song).toHaveProperty('title');
      expect(gameState.song).toHaveProperty('artist');
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