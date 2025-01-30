import type { MaskedLyrics, Token } from '@/app/api/lib/types/lyrics';

const WORD_REGEX = /\p{L}+|\p{N}+/gu;

export class MaskedLyricsService {
  /**
   * Create masked version of song lyrics
   */
  public create(title: string, artist: string, lyrics: string): MaskedLyrics {
    return {
      title: this.processText(title),
      artist: this.processText(artist),
      lyrics: this.processText(lyrics)
    };
  }

  /**
   * Process text into tokens
   */
  private processText(text: string): Token[] {
    const tokens: Token[] = [];
    let lastIndex = 0;

    // Find all word matches
    const matches = Array.from(text.matchAll(WORD_REGEX));
    
    for (const match of matches) {
      const startIndex = match.index!;
      
      // Add any non-word characters before this match as non-guessable tokens
      if (startIndex > lastIndex) {
        tokens.push({
          value: text.slice(lastIndex, startIndex),
          isToGuess: false
        });
      }

      // Add the word as a guessable token
      tokens.push({
        value: match[0],
        isToGuess: true
      });

      lastIndex = startIndex + match[0].length;
    }

    // Add any remaining non-word characters
    if (lastIndex < text.length) {
      tokens.push({
        value: text.slice(lastIndex),
        isToGuess: false
      });
    }

    return tokens;
  }

  /**
   * Get text representation of masked lyrics
   */
  public getText(masked: MaskedLyrics, guessedWords?: Set<string>): {
    title: string;
    artist: string;
    lyrics: string;
  } {
    return {
      title: this.reconstructText(masked.title, guessedWords),
      artist: this.reconstructText(masked.artist, guessedWords),
      lyrics: this.reconstructText(masked.lyrics, guessedWords)
    };
  }

  /**
   * Reconstruct text from tokens
   */
  private reconstructText(tokens: Token[], guessedWords?: Set<string>): string {
    if (!guessedWords) {
      return tokens.map(t => t.value).join('');
    }

    const normalizedGuesses = new Set(Array.from(guessedWords).map(w => w.toLowerCase().trim()));
    
    return tokens.map(token => {
      if (!token.isToGuess) return token.value;
      return normalizedGuesses.has(token.value.toLowerCase().trim())
        ? token.value
        : '_'.repeat(token.value.length);
    }).join('');
  }

  /**
   * Check if a word exists in any part of the masked lyrics
   */
  public hasWord(word: string, masked: MaskedLyrics): boolean {
    const normalizedWord = word.toLowerCase().trim();
    const sections = [masked.title, masked.artist, masked.lyrics];
    
    return sections.some(tokens => 
      tokens.some(t => t.isToGuess && t.value.toLowerCase().trim() === normalizedWord)
    );
  }
}

// Export singleton instance
export const maskedLyricsService = new MaskedLyricsService(); 