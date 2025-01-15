'use client';

import { useState, useCallback } from 'react';
import type { Game } from '@prisma/client';

interface UseAdminGameProps {
  initialGames?: Game[];
}

interface UseAdminGameReturn {
  games: Game[];
  isLoading: boolean;
  error: Error | null;
  createGame: (date: string, playlistId: string) => Promise<void>;
  refreshSeed: (date: string) => Promise<void>;
  deleteGame: (date: string) => Promise<void>;
}

export function useAdminGame({ initialGames = [] }: UseAdminGameProps = {}): UseAdminGameReturn {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createGame = useCallback(async (date: string, playlistId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/games/${date}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playlistId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const newGame = await response.json();
      setGames((prev) => [...prev, newGame]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSeed = useCallback(async (date: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/games/${date}/refresh-seed`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh seed');
      }

      const updatedGame = await response.json();
      setGames((prev) =>
        prev.map((game) =>
          new Date(game.date).toISOString().split('T')[0] === date ? updatedGame : game
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteGame = useCallback(async (date: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/games/${date}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete game');
      }

      setGames((prev) => prev.filter((game) => 
        new Date(game.date).toISOString().split('T')[0] !== date
      ));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    games,
    isLoading,
    error,
    createGame,
    refreshSeed,
    deleteGame,
  };
} 