import type { Guess } from '@prisma/client';
import type {
  MaskedContent,
  GeniusContent,
  SpotifyContent as ApiSpotifyContent,
} from '@/types/api';
import { createMaskedText, updateMasking } from '@/lib/game/masking';

export interface SpotifyTrack {
  title: string;
  artist: string;
  lyrics?: string | null;
  albumCover?: string;
  previewUrl: string | null;
}

export interface GameState {
  progress: {
    titleArtist: number;
    lyrics: number;
    overall: number;
  };
  maskedTitle: MaskedContent;
  maskedArtist: MaskedContent;
  maskedLyrics: MaskedContent | null;
  spotify: ApiSpotifyContent | null;
  genius: GeniusContent | null;
  isComplete: boolean;
}

export interface RevealThresholds {
  spotify: number;
  genius: number;
}

const DEFAULT_THRESHOLDS: RevealThresholds = {
  spotify: 0.5, // Reveal Spotify data at 50% progress
  genius: 0.75, // Reveal Genius data at 75% progress
};

export function computeGameState(
  content: SpotifyTrack,
  guesses: Array<Guess & { wasCorrect: boolean }>,
  thresholds: RevealThresholds = DEFAULT_THRESHOLDS,
): GameState {
  const revealedWords = new Set(
    guesses.filter((g) => g.wasCorrect).map((g) => g.word.toLowerCase()),
  );

  const maskedTitle = createMaskedText(content.title, Array.from(revealedWords));
  const maskedArtist = createMaskedText(content.artist, Array.from(revealedWords));
  const maskedLyrics = content.lyrics
    ? createMaskedText(content.lyrics, Array.from(revealedWords))
    : null;

  const { titleArtistProgress, lyricsProgress, isComplete } = computeProgress(
    maskedTitle,
    maskedArtist,
    maskedLyrics
  );

  // Use the higher progress value for overall progress
  const overallProgress = Math.max(titleArtistProgress, lyricsProgress);

  return {
    progress: {
      titleArtist: titleArtistProgress,
      lyrics: lyricsProgress,
      overall: overallProgress,
    },
    maskedTitle,
    maskedArtist,
    maskedLyrics,
    spotify: overallProgress >= thresholds.spotify
      ? {
          artistName: content.artist,
          songTitle: content.title,
          albumCover: content.albumCover,
          previewUrl: content.previewUrl,
        }
      : null,
    genius: overallProgress >= thresholds.genius && content.lyrics ? { lyrics: content.lyrics } : null,
    isComplete,
  };
}

export function updateGameState(
  currentState: GameState,
  guess: string,
  thresholds: RevealThresholds = DEFAULT_THRESHOLDS,
): GameState {
  const normalizedGuess = guess.toLowerCase().trim();

  // Update masked content
  const updatedLyrics = currentState.maskedLyrics
    ? updateMasking(currentState.maskedLyrics, normalizedGuess)
    : null;
  const updatedTitle = updateMasking(currentState.maskedTitle, normalizedGuess);
  const updatedArtist = updateMasking(currentState.maskedArtist, normalizedGuess);

  const { titleArtistProgress, lyricsProgress, isComplete } = computeProgress(
    updatedTitle,
    updatedArtist,
    updatedLyrics
  );

  // Use the higher progress value for overall progress
  const overallProgress = Math.max(titleArtistProgress, lyricsProgress);

  return {
    progress: {
      titleArtist: titleArtistProgress,
      lyrics: lyricsProgress,
      overall: overallProgress,
    },
    maskedTitle: updatedTitle,
    maskedArtist: updatedArtist,
    maskedLyrics: updatedLyrics,
    spotify: overallProgress >= thresholds.spotify ? currentState.spotify : null,
    genius: overallProgress >= thresholds.genius ? currentState.genius : null,
    isComplete,
  };
}

interface RevealState {
  lyrics: boolean;
  artist: boolean;
  title: boolean;
  spotify: boolean;
  genius: boolean;
}

export function computeRevealState(
  maskedTitle: MaskedContent,
  maskedArtist: MaskedContent,
  maskedLyrics: MaskedContent | null,
): RevealState {
  const { isComplete } = computeProgress(maskedTitle, maskedArtist, maskedLyrics);
  
  return {
    lyrics: true, // Always show masked lyrics
    artist: isComplete, // Only reveal on completion
    title: isComplete, // Only reveal on completion
    spotify: isComplete, // Only reveal on completion
    genius: isComplete, // Only reveal on completion
  };
}

export function computeProgress(
  maskedTitle: MaskedContent,
  maskedArtist: MaskedContent,
  maskedLyrics: MaskedContent | null,
): {
  titleArtistProgress: number;
  lyricsProgress: number;
  isComplete: boolean;
} {
  // Calculate title/artist progress
  const titleComplete = maskedTitle.revealedCount === maskedTitle.words.length;
  const artistComplete = maskedArtist.revealedCount === maskedArtist.words.length;
  const titleArtistProgress = (maskedTitle.revealedCount + maskedArtist.revealedCount) / 
                             (maskedTitle.words.length + maskedArtist.words.length);

  // Calculate lyrics progress
  const lyricsProgress = maskedLyrics 
    ? maskedLyrics.revealedCount / maskedLyrics.words.length
    : 0;

  // Win condition: (title AND artist complete) OR (80% lyrics found)
  const isComplete = (titleComplete && artistComplete) || lyricsProgress >= 0.8;

  return {
    titleArtistProgress,
    lyricsProgress,
    isComplete,
  };
}

export function updateMaskingState(
  currentState: GameState,
  guess: string,
  _allGuesses: Guess[],
  _totalWords: number
): GameState {
  const revealState = computeRevealState(
    currentState.maskedTitle, 
    currentState.maskedArtist, 
    currentState.maskedLyrics
  );
  
  const updatedState = updateGameState(currentState, guess);
  
  return {
    ...updatedState,
    progress: updatedState.progress,
    spotify: revealState.spotify ? updatedState.spotify : null,
    genius: revealState.genius ? updatedState.genius : null,
  };
}
