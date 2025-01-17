import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminGame } from '@/types/admin';

interface CreateGameInput {
  date: string;
  spotifyId: string;
}

const adminApi = {
  createOrUpdateGame: async ({ date, spotifyId }: CreateGameInput): Promise<AdminGame> => {
    const body = { date, spotifyId };
    console.log('Sending request with body:', body);
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
    return res.json();
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
    mutationFn: (input: CreateGameInput) => adminApi.createOrUpdateGame(input),
    onSuccess: (game) => {
      queryClient.setQueryData(queryKeys.games.byDate(game.date), game);
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (date: string) => adminApi.deleteGame(date),
    onSuccess: (_, date) => {
      queryClient.removeQueries({ queryKey: queryKeys.games.byDate(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
    }
  });

  return {
    createOrUpdateGame: (input: CreateGameInput) => createOrUpdateMutation.mutateAsync(input),
    deleteGame: (date: string) => deleteMutation.mutateAsync(date),
    isLoading: createOrUpdateMutation.isPending || deleteMutation.isPending
  };
} 