import { z } from 'zod';

// Schema for word position and state
const WordSchema = z.object({
  word: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
});

export type Word = z.infer<typeof WordSchema>;

// Schema for masked content (lyrics, title, or artist)
const MaskedContentSchema = z.object({
  original: z.string(),
  maskedText: z.string(),
  words: z.array(WordSchema),
});

export type MaskedContent = z.infer<typeof MaskedContentSchema>;

// Schema for game content
export const GameContentSchema = z.object({
  lyrics: MaskedContentSchema,
  title: MaskedContentSchema,
  artist: MaskedContentSchema,
});

export type GameContent = z.infer<typeof GameContentSchema>;

/**
 * Calculates progress for a specific masked content
 */
export function calculateProgress(content: MaskedContent, revealedWords: string[]): number {
  const totalWords = content.words.length;
  if (totalWords === 0) return 100;

  const revealed = new Set(revealedWords);
  const foundWords = content.words.filter((w) => revealed.has(w.word.toLowerCase())).length;
  return Math.round((foundWords / totalWords) * 100);
}

/**
 * Checks if the title and artist are fully revealed
 */
export function isTitleArtistComplete(
  title: MaskedContent,
  artist: MaskedContent,
  revealedWords: string[],
): boolean {
  return (
    calculateProgress(title, revealedWords) === 100 &&
    calculateProgress(artist, revealedWords) === 100
  );
}

/**
 * Checks if enough lyrics are revealed (80% threshold)
 */
export function isLyricsThresholdMet(lyrics: MaskedContent, revealedWords: string[]): boolean {
  return calculateProgress(lyrics, revealedWords) >= 80;
}

/**
 * Returns a list of unique words that haven't been revealed yet
 */
export function getRemainingWords(content: MaskedContent, revealedWords: string[]): string[] {
  const revealed = new Set(revealedWords);
  return Array.from(
    new Set(
      content.words.map((word) => word.word.toLowerCase()).filter((word) => !revealed.has(word)),
    ),
  ).sort();
}

/**
 * Updates masked text based on revealed words
 */
export function updateMaskedText(content: MaskedContent, revealedWords: string[]): string {
  const revealed = new Set(revealedWords.map((w) => w.toLowerCase()));
  const unrevealed = content.words.filter((word) => !revealed.has(word.word.toLowerCase()));

  let newMaskedText = content.original;
  unrevealed
    .sort((a, b) => b.startIndex - a.startIndex)
    .forEach((word) => {
      const originalWord = content.original.substring(word.startIndex, word.endIndex + 1);
      const maskedWord = originalWord.replace(/[a-zA-Z0-9]/g, '_');
      newMaskedText =
        newMaskedText.substring(0, word.startIndex) +
        maskedWord +
        newMaskedText.substring(word.endIndex + 1);
    });

  return newMaskedText;
}
