import type { Color } from '@/app/types';

// Re-export for backward compatibility
export type { Color };

// Word identity palette (decorative, stable per word) — six hues at matched
// lightness/chroma from the 2026 redesign spec. Raw hex, not Tailwind
// classes, so every surface (chips, lyrics, progress bars, share card) can
// consume the same value directly instead of composing bg/text utility pairs.
export const identityColors: string[] = [
  "#ffb0a3",
  "#f5c96b",
  "#7ee0b0",
  "#7cd6f0",
  "#b9a6ff",
  "#ffa8d4",
];

/** @deprecated kept only for legacy bg/text-class consumers; new code should use `identityColors` / `getWordColorDeterministic`. */
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
 * @deprecated legacy bg/text-class shape — see `getWordColorDeterministic`.
 */
export function getGameColor(index: number): Color {
  return gameColors[index % gameColors.length];
}

/**
 * Get a deterministic identity color (hex) for a word based on the word
 * itself, so the same word is always the same color for every player, every
 * day — decorative identity, never meaning.
 */
export function getWordColorDeterministic(word: string): string {
  const hash = hashString(word.toLowerCase());
  const colorIndex = hash % identityColors.length;
  return identityColors[colorIndex];
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