export const gameStateService = {
  getGameState: (key: string, gameState: any) => {
    expect(gameState).toBeDefined();
    expect(gameState).toHaveProperty('song');
    expect(gameState).toHaveProperty('guesses');
    expect(gameState).toHaveProperty('masked');
    
    // Validate data types
    expect(Array.isArray(gameState.guesses)).toBe(true);
    
    return gameState;
  }
}; 