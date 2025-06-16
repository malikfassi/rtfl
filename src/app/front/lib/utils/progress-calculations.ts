import { Token } from './word-processing';

interface ProgressData {
  found: number;
  total: number;
}

interface SectionProgress {
  progress: ProgressData;
  percent: number;
  isComplete: boolean;
}

/**
 * Calculates progress for a single section (lyrics, title, or artist)
 */
export function calculateSectionProgress(
  foundWords: string[],
  maskedParts?: Token[]
): SectionProgress {
  if (!maskedParts) {
    return {
      progress: { found: 0, total: 0 },
      percent: 0,
      isComplete: false
    };
  }

  const hiddenWords = maskedParts
    .filter(token => token.isToGuess)
    .map(token => token.value.toLowerCase());
  
  const total = hiddenWords.length;
  const found = hiddenWords.filter(word => foundWords.includes(word)).length;
  
  const percent = total > 0 ? Math.round((found / total) * 100) : 0;
  
  // Lyrics are complete at 80%, title and artist at 100%
  const isComplete = total > 0 && (
    maskedParts === maskedParts ? // If this is lyrics
      found / total >= 0.8 :
      found === total
  );

  return {
    progress: { found, total },
    percent,
    isComplete
  };
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
  isGameComplete: boolean;
} {
  const lyrics = calculateSectionProgress(foundWords, maskedLyricsParts);
  const title = calculateSectionProgress(foundWords, maskedTitleParts);
  const artist = calculateSectionProgress(foundWords, maskedArtistParts);

  // Game is complete if either:
  // 1. Lyrics are 80% complete, or
  // 2. Both title and artist are 100% complete
  const isGameComplete = lyrics.isComplete || (title.isComplete && artist.isComplete);

  return {
    lyrics,
    title,
    artist,
    isGameComplete
  };
} 