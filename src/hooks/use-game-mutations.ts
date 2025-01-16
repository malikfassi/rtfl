import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminGame } from '@/types/admin';

const adminApi = {
  createOrUpdateGame: async (date: string, spotifyId: string): Promise<AdminGame> => {
    const res = await fetch('/api/admin/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, spotifyId })
    });
    if (!res.ok) throw new Error('Failed to create/update game');
    return res.json();
  },

  deleteGame: async (date: string): Promise<void> => {
    const res = await fetch(`/api/admin/games?date=${date}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete game');
  }
};

export function useGameMutations(date: string | null) {
  const queryClient = useQueryClient();

  const createOrUpdateMutation = useMutation({
    mutationFn: (spotifyId: string) => 
      adminApi.createOrUpdateGame(date!, spotifyId),
    onSuccess: (game) => {
      queryClient.setQueryData(queryKeys.games.byDate(date!), game);
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteGame(date!),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.games.byDate(date!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
    }
  });

  return {
    createOrUpdateGame: createOrUpdateMutation.mutate,
    deleteGame: deleteMutation.mutate,
    isLoading: createOrUpdateMutation.isPending || deleteMutation.isPending
  };
} 