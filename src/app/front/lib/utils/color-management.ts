import type { Color } from '@/app/types';

// Re-export for backward compatibility
export type { Color };

export const gameColors: Color[] = [
  { bg: "bg-accent-info/20", text: "text-accent-info" },
  { bg: "bg-accent-success/20", text: "text-accent-success" },
  { bg: "bg-accent-warning/25", text: "text-accent-warning" },
  { bg: "bg-accent-error/20", text: "text-accent-error" },
  { bg: "bg-primary-dark/20", text: "text-primary-dark" },
];

/**
 * Simple hash function to generate a deterministic number from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a color from the game colors array, cycling through the array if index exceeds length
 */
export function getGameColor(index: number): Color {
  return gameColors[index % gameColors.length];
}

/**
 * Get a deterministic color for a word based on the word itself
 * This eliminates the need to pass the full guesses array
 */
export function getWordColorDeterministic(word: string): Color {
  const hash = hashString(word.toLowerCase());
  const colorIndex = hash % gameColors.length;
  return gameColors[colorIndex];
}

/**
 * Get a color for a word based on its position in the guesses array
 * @deprecated Use getWordColorDeterministic instead
 */
export function getWordColor(
  word: string,
  guesses: Array<{ word: string; valid: boolean }>
): Color | undefined {
  const index = guesses.findIndex(g => g.valid && g.word.toLowerCase() === word.toLowerCase());
  if (index === -1) return undefined;
  return getGameColor(index);
}

/**
 * Get a color for a guess based on its position in the guesses array
 */
export function getGuessColor(
  guessIndex: number
): Color {
  return getGameColor(guessIndex);
} 