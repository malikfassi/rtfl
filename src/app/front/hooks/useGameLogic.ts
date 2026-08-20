import { useGameState, useGuess } from './usePlayer';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import { useGameProgress } from './useGameProgress';
import { useGameShare } from './useGameShare';
import type { GameLogicProps, FrontendGameState } from '@/app/types';

export function useGameLogic({
  date
}: GameLogicProps): FrontendGameState {
  const playerId = getOrCreatePlayerId();

  // Get game state - only enable the query if we have a valid player ID
  const { data: currentGame, isLoading: isGameLoading, error: gameError, refetch: refetchGame } = useGameState(playerId, date, !!playerId);
  const guessMutation = useGuess(playerId, date);

  // Calculate found words
  const foundWords: string[] = Array.from(new Set(
    (currentGame?.guesses ?? [])
      ?.filter((g: { valid: boolean }) => g.valid)
      .map((g: { word: string }) => g.word.toLowerCase()) || []
  ));

  // Convert masked fields from arrays to strings if needed, but preserve token arrays for components
  const maskedTitle = Array.isArray(currentGame?.masked?.title)
    ? currentGame.masked.title.map((part: { value: string }) => part.value).join('')
    : (typeof currentGame?.masked?.title === 'string' ? currentGame.masked.title : '');
  const maskedArtist = Array.isArray(currentGame?.masked?.artist)
    ? currentGame.masked.artist.map((part: { value: string }) => part.value).join('')
    : (typeof currentGame?.masked?.artist === 'string' ? currentGame.masked.artist : '');
  const maskedLyrics = Array.isArray(currentGame?.masked?.lyrics)
    ? currentGame.masked.lyrics.map((part: { value: string }) => part.value).join('')
    : (typeof currentGame?.masked?.lyrics === 'string' ? currentGame.masked.lyrics : '');

  // Pass the raw arrays for masking logic - these preserve the original formatting
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

  // Handle guess submission - returns the freshly-fetched GameState so
  // callers can read the just-submitted guess's result without waiting on
  // a re-render with updated props.
  const handleGuess = async (guess: string) => {
    return guessMutation.mutateAsync(guess);
  };

  return {
    currentGame,
    isGameLoading,
    gameError,
    refetchGame,
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
    shareText,
    gameUrl,
    handleGuess,
    handleShare
  };
} 