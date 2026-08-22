"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GameState } from '@/app/types';
import { queryKeys } from '@/app/front/lib/query-client';

/** Why the easter-egg song is standing in for the game that was asked for. */
export const FALLBACK_REASONS: Record<number, string> = {
  400: "that date isn't a real one",
  403: "that game hasn't happened yet",
  404: 'no song was scheduled that day',
};

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

    // Known "no-game" statuses fall back to the easter egg, which is tagged
    // with the reason so the player is told what happened rather than being
    // handed another day's song as though it were the one they asked for.
    const reason = FALLBACK_REASONS[r.status];
    if (reason) {
      const rr = await fetch('/api/games/rickroll', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!rr.ok) return null;

      const fallback: GameState = await rr.json();
      return { ...fallback, fallbackReason: reason };
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

export function useGameState(userId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.games.byDate(date), userId],
    // A malformed date isn't short-circuited here any more: letting it reach
    // the API earns a 400, which is what carries the reason back to the player.
    queryFn: () => playerApi.getCurrentGame(userId, date),
    enabled,
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