import { useState } from 'react';
import { useGameState, useGuess } from './usePlayer';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import { useGameProgress } from './useGameProgress';
import { useGameShare } from './useGameShare';
import { useRickrollMode } from './useRickrollMode';

interface GameLogicProps {
  date: string;
  game?: any;
  rickrollMode?: boolean;
  lyrics?: string[];
  maskedLyrics?: string[];
}

interface GameState {
  currentGame: any;
  isGameLoading: boolean;
  gameError: Error | null;
  isRickroll: boolean;
  isFutureDate: boolean;
  isValidDate: boolean;
  showRickrollNotice: boolean;
  isGameComplete: boolean;
  lyricsProgressData: { found: number; total: number };
  titleProgressData: { found: number; total: number };
  artistProgressData: { found: number; total: number };
  foundWords: string[];
  maskedTitle: string;
  maskedArtist: string;
  maskedLyrics: string;
  maskedTitleParts: any;
  maskedArtistParts: any;
  maskedLyricsParts: any;
  guessSegments: Array<{ id: string; hits: number; colorIndex: number }>;
  shareText: string;
  gameUrl: string;
  handleGuess: (guess: string) => Promise<void>;
  handleShare: () => void;
}

export function useGameLogic({
  date,
  game,
  rickrollMode = false,
  lyrics: rickrollLyrics,
  maskedLyrics: rickrollMaskedLyrics
}: GameLogicProps): GameState {
  const [guessError, setGuessError] = useState<string | null>(null);
  const playerId = getOrCreatePlayerId();

  // Use the new useRickrollMode hook
  const {
    isRickroll,
    isFutureDate,
    isValidDate,
    showRickrollNotice,
    setShowRickrollNotice
  } = useRickrollMode({
    date,
    rickrollMode,
    lyrics: rickrollLyrics,
    maskedLyrics: rickrollMaskedLyrics
  });

  // Get game state
  const { data: currentGame, isLoading: isGameLoading, error: gameError } = useGameState(playerId, date);
  const guessMutation = useGuess(playerId, date);

  // Get total found word occurrences (not unique)
  const foundWordsCount = (currentGame?.guesses ?? [])
    ?.filter((g: { valid: boolean }) => g.valid)
    .reduce((count: number, g: { id: string; valid: boolean; word: string }) => {
      const lyricsText = typeof currentGame?.masked?.lyrics === 'string' 
        ? currentGame.masked.lyrics 
        : '';
      const words = Array.from(lyricsText.matchAll(/\p{L}+|\p{N}+/gu), (m: RegExpMatchArray) => m[0]) as string[];
      const hits = words.filter((word: string) => 
        word.toLowerCase() === g.word.toLowerCase()
      ).length;
      return count + hits;
    }, 0) || 0;

  // Calculate segments for each valid guess
  const guessSegments = (currentGame?.guesses ?? [])
    ?.filter((g: { valid: boolean }) => g.valid)
    .map((g: { id: string; valid: boolean; word: string }, index: number) => {
      const lyricsText = typeof currentGame?.masked?.lyrics === 'string' 
        ? currentGame.masked.lyrics 
        : '';
      const words = Array.from(lyricsText.matchAll(/\p{L}+|\p{N}+/gu), (m: RegExpMatchArray) => m[0]) as string[];
      const hits = words.filter((word: string) => 
        word.toLowerCase() === g.word.toLowerCase()
      ).length;
      return {
        id: g.id,
        hits,
        colorIndex: index % 5 // Using 5 colors from the original component
      };
    })
    .filter((segment: { hits: number }) => segment.hits > 0) || [];

  // Calculate found words
  const foundWords: string[] = Array.from(new Set(
    (currentGame?.guesses ?? [])
      ?.filter((g: { valid: boolean }) => g.valid)
      .map((g: { word: string }) => g.word.toLowerCase()) || []
  ));

  // Convert masked fields from arrays to strings if needed
  const maskedTitle = Array.isArray(currentGame?.masked?.title)
    ? currentGame.masked.title.map((part: { value: string }) => part.value).join('')
    : (typeof currentGame?.masked?.title === 'string' ? currentGame.masked.title : '');
  const maskedArtist = Array.isArray(currentGame?.masked?.artist)
    ? currentGame.masked.artist.map((part: { value: string }) => part.value).join('')
    : (typeof currentGame?.masked?.artist === 'string' ? currentGame.masked.artist : '');
  const maskedLyrics = Array.isArray(currentGame?.masked?.lyrics)
    ? currentGame.masked.lyrics.map((part: { value: string }) => part.value).join('')
    : (typeof currentGame?.masked?.lyrics === 'string' ? currentGame.masked.lyrics : '');

  // Pass the raw arrays for masking logic
  const maskedTitleParts = Array.isArray(currentGame?.masked?.title) ? currentGame.masked.title : undefined;
  const maskedArtistParts = Array.isArray(currentGame?.masked?.artist) ? currentGame.masked.artist : undefined;
  const maskedLyricsParts = Array.isArray(currentGame?.masked?.lyrics) ? currentGame.masked.lyrics : undefined;

  // Use the new useGameProgress hook
  const {
    lyricsProgressData,
    titleProgressData,
    artistProgressData,
    isGameComplete,
    lyricsPercent,
    titlePercent,
    artistPercent
  } = useGameProgress({
    foundWords,
    maskedTitleParts,
    maskedArtistParts,
    maskedLyricsParts,
  });

  // Use the new useGameShare hook
  const guessCount = currentGame?.guesses?.filter((g: { valid: boolean }) => g.valid).length ?? 0;
  const { shareText, gameUrl, handleShare } = useGameShare({
    isGameComplete,
    lyricsPercent,
    titlePercent,
    artistPercent,
    guessCount,
    date,
  });

  // Handle guess submission
  const handleGuess = async (guess: string) => {
    await guessMutation.mutateAsync(guess);
    setGuessError(null);
  };

  return {
    currentGame,
    isGameLoading,
    gameError,
    isRickroll,
    isFutureDate,
    isValidDate,
    showRickrollNotice,
    isGameComplete,
    lyricsProgressData,
    titleProgressData,
    artistProgressData,
    foundWords,
    maskedTitle,
    maskedArtist,
    maskedLyrics,
    maskedTitleParts,
    maskedArtistParts,
    maskedLyricsParts,
    guessSegments,
    shareText,
    gameUrl,
    handleGuess,
    handleShare
  };
} 