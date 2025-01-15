'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAdminGame } from '@/lib/hooks/useAdminGame';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

interface AdminContextValue {
  games: {
    list: ReturnType<typeof useAdminGame>['games'];
    isLoading: boolean;
    error: Error | null;
    createGame: (date: string, playlistId: string) => Promise<void>;
    refreshSeed: (date: string) => Promise<void>;
    deleteGame: (date: string) => Promise<void>;
  };
  analytics: {
    gameStats: ReturnType<typeof useAnalytics>['gameStats'];
    playerMetrics: ReturnType<typeof useAnalytics>['playerMetrics'];
    isLoading: boolean;
    error: Error | null;
    setTimeRange: (range: 'day' | 'week' | 'month' | 'all') => void;
  };
}

const AdminContext = createContext<AdminContextValue | null>(null);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const {
    games,
    isLoading: gamesLoading,
    error: gamesError,
    createGame,
    refreshSeed,
    deleteGame,
  } = useAdminGame();

  const {
    gameStats,
    playerMetrics,
    isLoading: analyticsLoading,
    error: analyticsError,
    setTimeRange,
  } = useAnalytics();

  const value: AdminContextValue = {
    games: {
      list: games,
      isLoading: gamesLoading,
      error: gamesError,
      createGame,
      refreshSeed,
      deleteGame,
    },
    analytics: {
      gameStats,
      playerMetrics,
      isLoading: analyticsLoading,
      error: analyticsError,
      setTimeRange,
    },
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 