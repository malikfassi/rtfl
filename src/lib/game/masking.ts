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

/**
 * Finds all words in the given text, handling contractions and special cases.
 * Words are defined as sequences of letters optionally containing apostrophes.
 */
export function findWords(text: string): Word[] {
  const pattern = /[a-zA-Z0-9]+(?:'[a-zA-Z]+)?/g;
  let match;
  const matches = [];

  while ((match = pattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    matches.push({
      word,
      startIndex: match.index,
      endIndex: match.index + match[0].length - 1,
    });
  }

  return matches;
}

/**
 * Masks the given text by replacing letters and numbers with underscores.
 * Preserves all other characters (punctuation, whitespace, etc).
 */
export function maskText(text: string, words: Word[]): string {
  let maskedText = text;

  // Sort words by start index in reverse order to avoid position shifts
  const sortedWords = [...words].sort((a, b) => b.startIndex - a.startIndex);

  for (const { startIndex, endIndex } of sortedWords) {
    const originalWord = text.substring(startIndex, endIndex + 1);
    const maskedWord = originalWord.replace(/[a-zA-Z0-9]/g, '_');
    maskedText =
      maskedText.substring(0, startIndex) + maskedWord + maskedText.substring(endIndex + 1);
  }

  return maskedText;
}

/**
 * Creates a masked version of the text where words are hidden.
 * Returns the original text, masked version, and word positions.
 */
export function createMaskedText(text: string): MaskedContent {
  const words = findWords(text);
  const maskedText = maskText(text, words);

  return MaskedContentSchema.parse({
    original: text,
    maskedText,
    words,
  });
}
