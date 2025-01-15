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
  progress: number;
  maskedTitle: MaskedContent;
  maskedArtist: MaskedContent;
  maskedLyrics: MaskedContent | null;
  spotify: ApiSpotifyContent | null;
  genius: GeniusContent | null;
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

  const progress = revealedWords.size / getUniqueWords(content).length;

  const maskedTitle = createMaskedText(content.title, Array.from(revealedWords));
  const maskedArtist = createMaskedText(content.artist, Array.from(revealedWords));
  const maskedLyrics = content.lyrics
    ? createMaskedText(content.lyrics, Array.from(revealedWords))
    : null;

  return {
    progress,
    maskedTitle,
    maskedArtist,
    maskedLyrics,
    spotify:
      progress >= thresholds.spotify
        ? {
            artistName: content.artist,
            songTitle: content.title,
            albumCover: content.albumCover,
            previewUrl: content.previewUrl,
          }
        : null,
    genius: progress >= thresholds.genius && content.lyrics ? { lyrics: content.lyrics } : null,
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

  // Recalculate progress
  const totalWords =
    (updatedLyrics?.words.length ?? 0) + updatedTitle.words.length + updatedArtist.words.length;
  const revealedWords =
    (updatedLyrics?.revealedCount ?? 0) + updatedTitle.revealedCount + updatedArtist.revealedCount;
  const progress = totalWords > 0 ? revealedWords / totalWords : 0;

  // Update revealed content based on new progress
  return {
    maskedLyrics: updatedLyrics,
    maskedTitle: updatedTitle,
    maskedArtist: updatedArtist,
    progress,
    spotify: progress >= thresholds.spotify ? currentState.spotify : null,
    genius: progress >= thresholds.genius ? currentState.genius : null,
  };
}

function getUniqueWords(content: SpotifyTrack): string[] {
  const words = new Set<string>();
  content.title
    .toLowerCase()
    .split(/\s+/)
    .forEach((w: string) => words.add(w));
  content.artist
    .toLowerCase()
    .split(/\s+/)
    .forEach((w: string) => words.add(w));
  if (content.lyrics) {
    content.lyrics
      .toLowerCase()
      .split(/\s+/)
      .forEach((w: string) => words.add(w));
  }
  return Array.from(words);
}
