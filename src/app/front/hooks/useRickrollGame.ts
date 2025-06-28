import { useState } from 'react';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';

interface RickrollGame {
  id: string;
  date: string;
  song: {
    spotifyId: string;
    spotifyData: {
      title: string;
      artist: string;
    };
  };
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  masked: {
    title: string | Array<{ value: string; isToGuess: boolean }>;
    artist: string | Array<{ value: string; isToGuess: boolean }>;
    lyrics: string | Array<{ value: string; isToGuess: boolean }>;
  };
}

export function useRickrollGame() {
  const [rickrollGame, setRickrollGame] = useState<RickrollGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRickrollGame = async () => {
    if (rickrollGame || isLoading) return rickrollGame;

    setIsLoading(true);
    setError(null);

    try {
      const playerId = getOrCreatePlayerId();
      const response = await fetch('/api/games/rickroll', {
        headers: {
          'x-user-id': playerId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rickroll game');
      }

      const gameData = await response.json();
      setRickrollGame(gameData);
      return gameData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rickroll game';
      setError(errorMessage);
      console.error('Failed to fetch rickroll game:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setRickrollGame(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    rickrollGame,
    isLoading,
    error,
    fetchRickrollGame,
    reset
  };
} 