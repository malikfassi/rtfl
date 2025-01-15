import type { Guess } from '@prisma/client';
import type { MaskedContent } from '@/types/api';

export function computeGuessCorrectness(
  guess: string,
  songTitle: string,
  artistName: string,
  lyrics: string | null,
): boolean {
  const normalizedWord = guess.toLowerCase().trim();
  const normalizedTitle = songTitle.toLowerCase();
  const normalizedArtist = artistName.toLowerCase();
  const normalizedLyrics = lyrics?.toLowerCase() ?? '';

  return (
    normalizedTitle.includes(normalizedWord) ||
    normalizedArtist.includes(normalizedWord) ||
    normalizedLyrics.includes(normalizedWord)
  );
}

export function computeProgress(
  maskedLyrics: MaskedContent | null,
  maskedTitle: MaskedContent,
  maskedArtist: MaskedContent,
): {
  progress: number;
  shouldRevealSpotify: boolean;
  shouldRevealGenius: boolean;
} {
  const totalWords =
    (maskedLyrics?.words.length ?? 0) + maskedTitle.words.length + maskedArtist.words.length;

  const revealedWords =
    (maskedLyrics?.revealedCount ?? 0) + maskedTitle.revealedCount + maskedArtist.revealedCount;

  const progress = totalWords > 0 ? revealedWords / totalWords : 0;

  return {
    progress,
    shouldRevealSpotify: progress >= 0.5,
    shouldRevealGenius: progress >= 0.75,
  };
}

export function computeGameProgress(
  guesses: Guess[],
  songTitle: string,
  artistName: string,
  lyrics: string | null,
): {
  totalGuesses: number;
  correctGuesses: number;
  isComplete: boolean;
} {
  const correctGuesses = guesses.filter((g) =>
    computeGuessCorrectness(g.word, songTitle, artistName, lyrics),
  ).length;

  return {
    totalGuesses: guesses.length,
    correctGuesses,
    isComplete: correctGuesses > 0 && correctGuesses === guesses.length,
  };
}
