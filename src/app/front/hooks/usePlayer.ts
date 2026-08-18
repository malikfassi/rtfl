"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GameState } from '@/app/types';
import { queryKeys } from '@/app/front/lib/query-client';

const playerApi = {
  getCurrentGame: async (userId: string, date: string): Promise<GameState | null> => {
    // Primary request for the requested date
    const r = await fetch(`/api/games/${date}`, {
      headers: {
        'x-user-id': userId,
      },
    });

    // Happy path – the requested game exists
    if (r.ok) {
      return await r.json();
    }

    // Graceful fallback – known "no-game" statuses
    if ([400, 403, 404].includes(r.status)) {
      const rr = await fetch('/api/games/rickroll', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (rr.ok) {
        // If it was a 403 (future date), throw an error to preserve the error state
        if (r.status === 403) {
          throw new Error('403');
        }
        return await rr.json(); // Rickroll available ✅
      }
      return null; // Rickroll also failed – show "No game"
    }

    // Unexpected error – bubble up to React-Query error state
    const errorBody = await r.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? 'Failed');
  },

  submitGuess: async (userId: string, date: string, guess: string): Promise<GameState> => {
    const response = await fetch(`/api/games/${date}/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ guess }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit guess');
    }
    return response.json();
  },

  getGamesByMonth: async (userId: string, month: string): Promise<GameState[]> => {
    const response = await fetch(`/api/games/month/${month}`, {
      headers: { 'x-user-id': userId }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch month games');
    }
    return response.json();
  }
};

function isValidDate(date: string) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

export function useGameState(userId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.games.byDate(date), userId],
    queryFn: () => {
      if (!isValidDate(date)) {
        return playerApi.getCurrentGame(userId, 'rickroll');
      }
      return playerApi.getCurrentGame(userId, date);
    },
    enabled: enabled || !isValidDate(date),
  });
}

export function useGuess(userId: string, date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guess: string) => playerApi.submitGuess(userId, date, guess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(date) });
    },
  });
}

export function useGameMonth(userId: string, month: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.games.byMonth(month), userId],
    queryFn: () => playerApi.getGamesByMonth(userId, month),
    enabled: enabled && !!userId && !!month,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
} 