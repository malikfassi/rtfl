"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import type { GameState } from '@/app/api/lib/types/game';
import { queryKeys } from '@/app/front/lib/query-client';
import { useToast } from '@/app/front/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface GameInterfaceState {
  playerId: string;
  totalWords: number;
  foundWords: string[];
  guesses: Array<{ word: string }>;
  _title: string;
  _artist: string;
  masked: {
    title: string;
    artist: string;
    lyrics: string;
  };
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
  return useQuery<GameState, Error, GameInterfaceState>({
    queryKey: queryKeys.games.byDate(new Date(date)),
    queryFn: () => playerApi.getCurrentGame(userId, date),
    select: (data) => ({
      playerId: userId,
      totalWords: data.masked.title.split(' ').length + data.masked.artist.split(' ').length,
      foundWords: data.guesses.map(g => g.word),
      guesses: data.guesses,
      _title: data.masked.title,
      _artist: data.masked.artist,
      masked: data.masked
    }),
  });
}

export function useGuess(userId: string, date: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guess: string) => playerApi.submitGuess(userId, date, guess),
    onSuccess: (_, guess) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(new Date(date)) });
      toast({
        title: "Correct!",
        description: `You found the word "${guess}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit guess",
        variant: "destructive",
      });
    },
  });
}

export function useGameMonth(userId: string, month: string) {
  return useQuery<GameState[]>({
    queryKey: queryKeys.games.byMonth(new Date(month)),
    queryFn: () => playerApi.getGamesByMonth(userId, month),
  });
} 