"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import type { GameState } from '@/app/api/lib/types/game';
import type { Guess, Song } from '@prisma/client';
import { queryKeys } from '@/app/front/lib/query-client';
import { useQueryClient } from '@tanstack/react-query';

interface GameInterfaceState {
  playerId: string;
  guesses: Array<Guess & { valid: boolean }>;
  _title: string;
  _artist: string;
  masked: {
    title: string;
    artist: string;
    lyrics: string;
  };
  song?: Song;
}

const playerApi = {
  getCurrentGame: async (userId: string, date: string): Promise<GameState> => {
    const response = await fetch(`/api/games/${date}`, {
      headers: { 'x-user-id': userId }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch game state');
    }
    return response.json();
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

export function useGameState(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.games.byDate(new Date(date)),
    queryFn: () => playerApi.getCurrentGame(userId, date),
  });
}

export function useGuess(userId: string, date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guess: string) => playerApi.submitGuess(userId, date, guess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(new Date(date)) });
    },
  });
}

export function useMonthGames(userId: string, month: string) {
  return useQuery({
    queryKey: queryKeys.games.byMonth(new Date(month)),
    queryFn: () => playerApi.getGamesByMonth(userId, month),
  });
} 