import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/app/front/lib/query-client';
import type { AdminGame } from '@/app/types/admin';

interface CreateGameInput {
  date: string;
  spotifyId: string;
}

const adminApi = {
  createOrUpdateGame: async ({ date, spotifyId }: CreateGameInput): Promise<AdminGame> => {
    console.log('Creating/updating game:', { date, spotifyId });
    const res = await fetch('/api/admin/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date, spotifyId }),
    });
    
    if (!res.ok) {
      console.error('API error:', { status: res.status, statusText: res.statusText });
      const errorData = await res.json().catch(() => null);
      console.error('Error response:', errorData);
      throw new Error(errorData?.message || 'Failed to create/update game');
    }
    const data = await res.json();
    console.log('Game created/updated:', { 
      date: data.date, 
      spotifyId: data.song.spotifyId,
      title: data.song.title 
    });
    return data;
  },

  deleteGame: async (date: string): Promise<void> => {
    const res = await fetch(`/api/admin/games?date=${date}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete game');
    }
  },
};

export function useGameMutations() {
  const queryClient = useQueryClient();

  const createOrUpdateGame = useMutation({
    mutationFn: (input: CreateGameInput) => adminApi.createOrUpdateGame(input),
    onSuccess: (game) => {
      // Invalidate all games queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.games.all,
        refetchType: 'all'
      });
      
      // Update the specific game in the cache
      queryClient.setQueryData(queryKeys.games.byDate(new Date(game.date)), game);
      
      // Invalidate the month view
      const month = new Date(game.date.substring(0, 7)); // YYYY-MM
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.games.byMonth(month),
        refetchType: 'all'
      });
    },
  });

  const deleteGame = useMutation({
    mutationFn: adminApi.deleteGame,
    onSuccess: (_, date) => {
      // Remove the specific game from cache
      queryClient.removeQueries({ queryKey: queryKeys.games.byDate(new Date(date)) });
      
      // Invalidate all games queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.games.all,
        refetchType: 'all'
      });
      
      // Invalidate the month view
      const month = new Date(date.substring(0, 7)); // YYYY-MM
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.games.byMonth(month),
        refetchType: 'all'
      });
    },
  });

  return {
    createOrUpdateGame: (input: CreateGameInput) => createOrUpdateGame.mutateAsync(input),
    deleteGame: (date: string) => deleteGame.mutateAsync(date),
    isLoading: createOrUpdateGame.isPending || deleteGame.isPending
  };
} 