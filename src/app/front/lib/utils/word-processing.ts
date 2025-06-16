export interface Token {
  value: string;
  isToGuess: boolean;
}

interface WordState {
  isFound: boolean;
  shouldShow: boolean;
  isNewlyFound: boolean;
  isHovered: boolean;
  isSelected: boolean;
}

export function calculateWordState(
  word: string,
  foundWords: string[],
  hoveredWord: string | null,
  selectedWord: string | null,
  isComplete: boolean,
  showFullLyrics: boolean
): WordState {
  const isFound = foundWords.includes(word.toLowerCase());
  const shouldShow = isFound || (isComplete && showFullLyrics);
  const isNewlyFound = isFound && foundWords[foundWords.length - 1] === word.toLowerCase();
  const isHovered = Boolean(hoveredWord && word.toLowerCase() === hoveredWord.toLowerCase());
  const isSelected = Boolean(selectedWord && word.toLowerCase() === selectedWord.toLowerCase());

  return {
    isFound,
    shouldShow,
    isNewlyFound,
    isHovered,
    isSelected
  };
}

export function getWordColor(word: string, guesses: Array<{ word: string; valid: boolean }>, colors: Array<{ bg: string; text: string }>) {
  const index = guesses.findIndex(g => g.valid && g.word.toLowerCase() === word.toLowerCase());
  if (index === -1) return undefined;
  return colors[index % colors.length];
}

export function splitIntoTokens(text: string): string[] {
  return text.match(/(\p{L}+|\p{N}+|\s+|[^\p{L}\p{N}\s]+)/gu) || [];
}

export function isWord(token: string): boolean {
  return new RegExp('^(\\p{L}+|\\p{N}+)$', 'u').test(token);
}

export function isWhitespace(token: string): boolean {
  return /^\s+$/.test(token);
} 