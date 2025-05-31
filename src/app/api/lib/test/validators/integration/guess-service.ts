import type { Guess } from '@prisma/client';

export const guessService = {
  submitGuess: (guess: Guess) => {
    expect(guess).toBeDefined();
    expect(guess).toHaveProperty('id');
    expect(guess).toHaveProperty('gameId');
    expect(guess).toHaveProperty('playerId');
    expect(guess).toHaveProperty('word');
    expect(guess).toHaveProperty('valid');
    expect(guess).toHaveProperty('createdAt');
    
    // Validate data types
    expect(typeof guess.id).toBe('string');
    expect(typeof guess.gameId).toBe('string');
    expect(typeof guess.playerId).toBe('string');
    expect(typeof guess.word).toBe('string');
    expect(typeof guess.valid).toBe('boolean');
    
    // Validate word is not empty and normalized
    expect(guess.word.trim().length).toBeGreaterThan(0);
    expect(guess.word).not.toContain('  '); // No double spaces
    expect(guess.word).toBe(guess.word.toLowerCase()); // Should be lowercase
    
    // Validate creation timestamp is reasonable
    const createdAt = new Date(guess.createdAt);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    expect(createdAt).toBeInstanceOf(Date);
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
    expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    
    return guess;
  },

  getPlayerGuesses: (guesses: Guess[]) => {
    expect(guesses).toBeDefined();
    expect(Array.isArray(guesses)).toBe(true);
    
    // Validate all guesses belong to same player and game
    if (guesses.length > 1) {
      const firstPlayerId = guesses[0].playerId;
      const firstGameId = guesses[0].gameId;
      
      guesses.forEach(guess => {
        expect(guess.playerId).toBe(firstPlayerId);
        expect(guess.gameId).toBe(firstGameId);
      });
    }
    
    guesses.forEach(guess => {
      guessService.submitGuess(guess);
    });
    
    return guesses;
  }
}; 