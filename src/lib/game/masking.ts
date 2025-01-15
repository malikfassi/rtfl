import type { MaskedContent } from '@/types/api';

export function createMaskedText(text: string, revealedWords: string[] = []): MaskedContent {
  if (!text) {
    return {
      original: '',
      maskedText: '',
      words: [],
      revealedCount: 0,
    };
  }
  const normalizedRevealed = new Set(revealedWords.map((w) => w.toLowerCase()));

  const words = text.split(/\s+/).map((word) => {
    const startIndex = text.indexOf(word);
    const isRevealed = normalizedRevealed.has(word.toLowerCase());
    return {
      word: word.toLowerCase(),
      startIndex,
      endIndex: startIndex + word.length - 1,
      isRevealed,
    };
  });

  const maskedText = text.replace(/\w+/g, (match) => {
    return normalizedRevealed.has(match.toLowerCase()) ? match : '_'.repeat(match.length);
  });

  return {
    original: text,
    maskedText,
    words,
    revealedCount: words.filter((w) => w.isRevealed).length,
  };
}

export function updateMasking(content: MaskedContent, guess: string): MaskedContent {
  const normalizedGuess = guess.toLowerCase().trim();
  let updated = false;

  const words = content.words.map((word) => {
    if (!word.isRevealed && word.word === normalizedGuess) {
      updated = true;
      return { ...word, isRevealed: true };
    }
    return word;
  });

  if (!updated) {
    return content;
  }

  const maskedText = content.original.replace(/\w+/g, (match) => {
    const matchWord = match.toLowerCase();
    return words.some((w) => w.word === matchWord && w.isRevealed)
      ? match
      : '_'.repeat(match.length);
  });

  return {
    ...content,
    maskedText,
    words,
    revealedCount: words.filter((w) => w.isRevealed).length,
  };
}
