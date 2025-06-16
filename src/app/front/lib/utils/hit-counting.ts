import { Token } from './word-processing';

interface HitCountingOptions {
  word: string;
  maskedText?: string;
  maskedParts?: Token[];
}

/**
 * Counts the number of hits for a word in a masked text or parts array
 * Uses token-based counting when available (more accurate), falls back to regex
 */
export function countHits({ word, maskedText, maskedParts }: HitCountingOptions): number {
  let hits = 0;
  
  // Use token-based counting when available (more accurate)
  if (maskedParts) {
    hits += maskedParts
      .filter(token => token.isToGuess && token.value.toLowerCase() === word.toLowerCase())
      .length;
  } else if (maskedText) {
    // Fallback to regex with word boundaries
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    hits += (maskedText.match(wordRegex) || []).length;
  }
  
  return hits;
}

/**
 * Counts hits for a word across multiple sections (lyrics, title, artist)
 */
export function countTotalHits({
  word,
  maskedLyrics,
  maskedTitle,
  maskedArtist,
  maskedLyricsParts,
  maskedTitleParts,
  maskedArtistParts,
}: {
  word: string;
  maskedLyrics?: string;
  maskedTitle?: string;
  maskedArtist?: string;
  maskedLyricsParts?: Token[];
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
}): number {
  let totalHits = 0;
  
  // Count hits in lyrics
  totalHits += countHits({ word, maskedText: maskedLyrics, maskedParts: maskedLyricsParts });
  
  // Count hits in title
  totalHits += countHits({ word, maskedText: maskedTitle, maskedParts: maskedTitleParts });
  
  // Count hits in artist
  totalHits += countHits({ word, maskedText: maskedArtist, maskedParts: maskedArtistParts });
  
  return totalHits;
}

/**
 * Calculates hit counts for an array of guesses
 */
export function calculateGuessHits({
  guesses,
  maskedLyrics,
  maskedTitle,
  maskedArtist,
  maskedLyricsParts,
  maskedTitleParts,
  maskedArtistParts,
}: {
  guesses: Array<{ id: string; word: string; valid: boolean }>;
  maskedLyrics?: string;
  maskedTitle?: string;
  maskedArtist?: string;
  maskedLyricsParts?: Token[];
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
}): Array<{ id: string; word: string; valid: boolean; hits: number }> {
  return guesses.map(guess => ({
    ...guess,
    hits: countTotalHits({
      word: guess.word,
      maskedLyrics,
      maskedTitle,
      maskedArtist,
      maskedLyricsParts,
      maskedTitleParts,
      maskedArtistParts,
    })
  }));
} 