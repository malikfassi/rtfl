import type { GameState } from '@/app/types';
import { getOrCreatePlayerId } from './helpers/player';

export async function getCurrentGame(date: string): Promise<GameState | null> {
  const playerId = getOrCreatePlayerId();
  
  // On server side, playerId will be empty string, so we can't fetch
  // Let the client handle the actual fetching
  if (!playerId) {
    return null;
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/games/${date}`, {
    headers: {
      'x-user-id': playerId,
    },
  });

  if (response.ok) {
    return response.json();
  }

  if (response.status === 404) {
    return null;
  }

  const errorBody = await response.json().catch(() => ({}));
  throw new Error(errorBody?.message ?? 'Failed to fetch game');
} 