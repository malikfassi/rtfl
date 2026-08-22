import type { Token } from '@/app/types';

interface ProgressData {
  found: number;
  total: number;
}

interface SectionProgress {
  progress: ProgressData;
  percent: number;
}

/**
 * Calculates progress for a single section (lyrics, title, or artist)
 */
function calculateSectionProgress(
  foundWords: string[],
  maskedParts?: Token[]
): SectionProgress {
  if (!maskedParts) {
    return {
      progress: { found: 0, total: 0 },
      percent: 0,
    };
  }

  const hiddenWords = maskedParts
    .filter(token => token.isToGuess)
    .map(token => token.value.toLowerCase());

  const total = hiddenWords.length;
  const found = hiddenWords.filter(word => foundWords.includes(word)).length;

  const percent = total > 0 ? Math.round((found / total) * 100) : 0;

  return {
    progress: { found, total },
    percent,
  };
}

/**
 * Share of guesses that landed. Shown as a percentage rather than "5/8"
 * wherever the guess count is already on screen, so the denominator isn't
 * repeated.
 */
export function precisionPercent(hits: number, attempts: number): number {
  return attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
}

/**
 * Calculates progress for all sections (lyrics, title, artist)
 */
export function calculateGameProgress({
  foundWords,
  maskedLyricsParts,
  maskedTitleParts,
  maskedArtistParts,
}: {
  foundWords: string[];
  maskedLyricsParts?: Token[];
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
}): {
  lyrics: SectionProgress;
  title: SectionProgress;
  artist: SectionProgress;
} {
  return {
    lyrics: calculateSectionProgress(foundWords, maskedLyricsParts),
    title: calculateSectionProgress(foundWords, maskedTitleParts),
    artist: calculateSectionProgress(foundWords, maskedArtistParts),
  };
}
