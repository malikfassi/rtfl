import { useMemo } from 'react';
import { calculateGameProgress } from '@/app/front/lib/utils/progress-calculations';

interface GameProgressProps {
  foundWords: string[];
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
}

interface GameProgressState {
  lyricsProgressData: { found: number; total: number };
  titleProgressData: { found: number; total: number };
  artistProgressData: { found: number; total: number };
  lyricsWin: boolean;
  titleWin: boolean;
  artistWin: boolean;
  isGameComplete: boolean;
  lyricsPercent: number;
  titlePercent: number;
  artistPercent: number;
}

export function useGameProgress({
  foundWords,
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
}: GameProgressProps): GameProgressState {
  const progress = useMemo(() => 
    calculateGameProgress({
      foundWords,
      maskedTitleParts,
      maskedArtistParts,
      maskedLyricsParts,
    }),
    [foundWords, maskedTitleParts, maskedArtistParts, maskedLyricsParts]
  );

  return {
    lyricsProgressData: progress.lyrics.progress,
    titleProgressData: progress.title.progress,
    artistProgressData: progress.artist.progress,
    lyricsWin: progress.lyrics.isComplete,
    titleWin: progress.title.isComplete,
    artistWin: progress.artist.isComplete,
    isGameComplete: progress.isGameComplete,
    lyricsPercent: progress.lyrics.percent,
    titlePercent: progress.title.percent,
    artistPercent: progress.artist.percent,
  };
} 