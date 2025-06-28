interface Token {
  value: string;
  isToGuess: boolean;
}

interface MaskedLyrics {
  title: Token[];
  artist: Token[];
  lyrics: Token[];
}

export const maskedLyricsService = {
  create: (key: string, maskedLyrics: MaskedLyrics) => {
    expect(maskedLyrics).toBeDefined();
    expect(maskedLyrics).toHaveProperty('title');
    expect(maskedLyrics).toHaveProperty('artist');
    expect(maskedLyrics).toHaveProperty('lyrics');
    expect(Array.isArray(maskedLyrics.title)).toBe(true);
    expect(Array.isArray(maskedLyrics.artist)).toBe(true);
    expect(Array.isArray(maskedLyrics.lyrics)).toBe(true);
    // Check that at least one guessable token exists in each section
    expect(maskedLyrics.title.some((t: Token) => t.isToGuess)).toBe(true);
    expect(maskedLyrics.artist.some((t: Token) => t.isToGuess)).toBe(true);
    expect(maskedLyrics.lyrics.some((t: Token) => t.isToGuess)).toBe(true);
    // Optionally, check that all tokens have 'value' and 'isToGuess'
    for (const section of ['title', 'artist', 'lyrics']) {
      for (const token of maskedLyrics[section as keyof MaskedLyrics]) {
        expect(token).toHaveProperty('value');
        expect(typeof token.value).toBe('string');
        expect(token).toHaveProperty('isToGuess');
        expect(typeof token.isToGuess).toBe('boolean');
      }
    }
    return maskedLyrics;
  }
}; 