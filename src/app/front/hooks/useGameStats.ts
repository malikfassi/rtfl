import { useGameState } from './usePlayer';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';

export function useGameStats(date: string, enabled: boolean = true) {
  const playerId = getOrCreatePlayerId();
  const { data: gameState } = useGameState(playerId, date, enabled);

  return {
    data: gameState?.stats,
    isLoading: !gameState,
    error: null
  };
} 