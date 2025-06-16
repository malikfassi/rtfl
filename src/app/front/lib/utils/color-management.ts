export interface Color {
  bg: string;
  text: string;
}

export const gameColors: Color[] = [
  { bg: "bg-accent-info/20", text: "text-accent-info" },
  { bg: "bg-accent-success/20", text: "text-accent-success" },
  { bg: "bg-accent-warning/25", text: "text-accent-warning" },
  { bg: "bg-accent-error/20", text: "text-accent-error" },
  { bg: "bg-primary-dark/20", text: "text-primary-dark" },
];

/**
 * Get a color from the game colors array, cycling through the array if index exceeds length
 */
export function getGameColor(index: number): Color {
  return gameColors[index % gameColors.length];
}

/**
 * Get a color for a word based on its position in the guesses array
 */
export function getWordColor(
  word: string,
  guesses: Array<{ word: string; valid: boolean }>,
  colors: Color[] = gameColors
): Color | undefined {
  const index = guesses.findIndex(g => g.valid && g.word.toLowerCase() === word.toLowerCase());
  if (index === -1) return undefined;
  return getGameColor(index);
}

/**
 * Get a color for a guess based on its position in the guesses array
 */
export function getGuessColor(
  guessIndex: number,
  colors: Color[] = gameColors
): Color {
  return getGameColor(guessIndex);
} 