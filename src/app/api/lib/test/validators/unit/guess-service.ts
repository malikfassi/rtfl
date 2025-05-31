import type { Guess } from '@prisma/client';

export const guessService = {
  submitGuess: (key: string, guess: Guess) => {
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
    
    // Validate word is not empty
    expect(guess.word.trim().length).toBeGreaterThan(0);
    
    return guess;
  },

  getPlayerGuesses: (key: string, guesses: Guess[]) => {
    expect(guesses).toBeDefined();
    expect(Array.isArray(guesses)).toBe(true);
    
    guesses.forEach(guess => {
      guessService.submitGuess(key, guess);
    });
    
    return guesses;
  }
}; 