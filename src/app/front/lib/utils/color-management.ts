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
 * Get a deterministic identity color (hex) for a word based on the word
 * itself, so the same word is always the same color for every player, every
 * day — decorative identity, never meaning.
 */
export function getWordColorDeterministic(word: string): string {
  const hash = hashString(word.toLowerCase());
  const colorIndex = hash % identityColors.length;
  return identityColors[colorIndex];
}
