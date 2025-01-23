import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminGame } from '@/types/admin';

interface CreateGameInput {
  date: string;
  spotifyId: string;
}

export const gameApi = {
  createOrUpdateGame: async ({ date, spotifyId }: CreateGameInput): Promise<AdminGame> => {
    const body = { date, spotifyId };
    console.log('Creating/updating game:', { date, spotifyId });
    const res = await fetch('/api/admin/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.error('API error:', { status: res.status, statusText: res.statusText });
      const errorData = await res.json().catch(() => null);
      console.error('Error response:', errorData);
      throw new Error('Failed to create/update game');
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
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete game');
  }
};

export function useGameMutations() {
  const queryClient = useQueryClient();

  const createOrUpdateMutation = useMutation({
    mutationFn: (input: CreateGameInput) => gameApi.createOrUpdateGame(input),
    onSuccess: (game) => {
      queryClient.invalidateQueries({ 
        queryKey: [queryKeys.games.all],
        refetchType: 'all'
      });
      
      queryClient.setQueryData(queryKeys.games.byDate(game.date), game);
      
      const month = game.date.substring(0, 7); // YYYY-MM
      queryClient.invalidateQueries({ 
        queryKey: ['games', 'month', month],
        refetchType: 'all'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (date: string) => gameApi.deleteGame(date),
    onSuccess: (_, date) => {
      const month = date.substring(0, 7); // YYYY-MM
      
      queryClient.removeQueries({ queryKey: queryKeys.games.byDate(date) });
      
      queryClient.invalidateQueries({ 
        queryKey: [queryKeys.games.all],
        refetchType: 'all'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['games', 'month', month],
        refetchType: 'all'
      });
    }
  });

  return {
    createOrUpdateGame: (input: CreateGameInput) => createOrUpdateMutation.mutateAsync(input),
    deleteGame: (date: string) => deleteMutation.mutateAsync(date),
    isLoading: createOrUpdateMutation.isPending || deleteMutation.isPending
  };
} 