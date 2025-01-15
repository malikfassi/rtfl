'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Game } from '@prisma/client';

interface GameWithProgress extends Game {
  progress: {
    titleArtist: number;
    lyrics: number;
    overall: number;
  };
  isComplete: boolean;
}

interface UseGameListProps {
  startDate?: Date;
  endDate?: Date;
}

interface UseGameListReturn {
  games: GameWithProgress[];
  isLoading: boolean;
  error: Error | null;
  refreshGames: () => Promise<void>;
  filterByDate: (start: Date, end: Date) => void;
}

export function useGameList({ startDate, endDate }: UseGameListProps = {}): UseGameListReturn {
  const [games, setGames] = useState<GameWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: Date; end: Date } | null>(
    startDate && endDate ? { start: startDate, end: endDate } : null
  );

  // Fetch games
  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      let url = '/api/games';

      // Add date filter query params if present
      if (dateFilter) {
        const params = new URLSearchParams({
          start: dateFilter.start.toISOString(),
          end: dateFilter.end.toISOString(),
        });
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  // Initial fetch
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Filter games by date range
  const filterByDate = useCallback((start: Date, end: Date) => {
    setDateFilter({ start, end });
  }, []);

  // Refresh games list
  const refreshGames = useCallback(async () => {
    await fetchGames();
  }, [fetchGames]);

  return {
    games,
    isLoading,
    error,
    refreshGames,
    filterByDate,
  };
} 