'use client';

import { useCallback, useEffect, useState } from 'react';

interface GameStats {
  totalGames: number;
  activeGames: number;
  completedGames: number;
  averageCompletionRate: number;
  averageGuessCount: number;
  averageCompletionTime: number;
}

interface PlayerMetrics {
  totalPlayers: number;
  activePlayers: number;
  topPlayers: Array<{
    username: string;
    gamesCompleted: number;
    averageScore: number;
    averageTime: number;
  }>;
}

interface UseAnalyticsProps {
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

interface UseAnalyticsReturn {
  gameStats: GameStats;
  playerMetrics: PlayerMetrics;
  isLoading: boolean;
  error: Error | null;
  setTimeRange: (range: 'day' | 'week' | 'month' | 'all') => void;
}

const DEFAULT_GAME_STATS: GameStats = {
  totalGames: 0,
  activeGames: 0,
  completedGames: 0,
  averageCompletionRate: 0,
  averageGuessCount: 0,
  averageCompletionTime: 0,
};

const DEFAULT_PLAYER_METRICS: PlayerMetrics = {
  totalPlayers: 0,
  activePlayers: 0,
  topPlayers: [],
};

export function useAnalytics({ timeRange = 'all' }: UseAnalyticsProps = {}): UseAnalyticsReturn {
  const [gameStats, setGameStats] = useState<GameStats>(DEFAULT_GAME_STATS);
  const [playerMetrics, setPlayerMetrics] = useState<PlayerMetrics>(DEFAULT_PLAYER_METRICS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${selectedTimeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setGameStats(data.gameStats);
      setPlayerMetrics(data.playerMetrics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const setTimeRange = useCallback((range: 'day' | 'week' | 'month' | 'all') => {
    setSelectedTimeRange(range);
  }, []);

  return {
    gameStats,
    playerMetrics,
    isLoading,
    error,
    setTimeRange,
  };
} 