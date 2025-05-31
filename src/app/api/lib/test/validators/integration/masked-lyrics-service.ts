export const maskedLyricsService = {
  create: (maskedLyrics: any) => {
    expect(maskedLyrics).toBeDefined();
    expect(maskedLyrics).toHaveProperty('originalLyrics');
    expect(maskedLyrics).toHaveProperty('maskedLyrics');
    expect(maskedLyrics).toHaveProperty('totalWords');
    expect(maskedLyrics).toHaveProperty('guessableWords');
    
    // Validate data types
    expect(typeof maskedLyrics.originalLyrics).toBe('string');
    expect(typeof maskedLyrics.maskedLyrics).toBe('string');
    expect(typeof maskedLyrics.totalWords).toBe('number');
    expect(typeof maskedLyrics.guessableWords).toBe('number');
    
    // Validate counts are realistic
    expect(maskedLyrics.totalWords).toBeGreaterThan(0);
    expect(maskedLyrics.guessableWords).toBeGreaterThan(0);
    expect(maskedLyrics.guessableWords).toBeLessThanOrEqual(maskedLyrics.totalWords);
    
    // For integration tests, expect reasonable word counts
    expect(maskedLyrics.totalWords).toBeGreaterThan(10); // Songs should have more than 10 words
    expect(maskedLyrics.totalWords).toBeLessThan(10000); // But not unreasonably many
    
    // Validate masked lyrics contains mask characters
    expect(maskedLyrics.maskedLyrics).toContain('_');
    
    return maskedLyrics;
  }
}; 