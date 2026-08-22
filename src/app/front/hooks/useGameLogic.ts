import { useGameState, useGuess } from './usePlayer';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import type { GameLogicProps, FrontendGameState } from '@/app/types';

export function useGameLogic({
  date
}: GameLogicProps): FrontendGameState {
  const playerId = getOrCreatePlayerId();

  const { data: currentGame, isLoading: isGameLoading, error: gameError, refetch: refetchGame } = useGameState(playerId, date, !!playerId);
  const guessMutation = useGuess(playerId, date);

  // Returns the freshly-fetched GameState from the mutation response so
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
    handleGuess,
  };
}
