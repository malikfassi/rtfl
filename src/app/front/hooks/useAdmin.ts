import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { GameWithSong } from '@/app/api/lib/services/game';
import { queryKeys } from '@/app/front/lib/query-client';

const adminApi = {
  getGame: async (date: string): Promise<GameWithSong> => {
    const response = await fetch(`/api/admin/games/${date}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch game');
    }
    return response.json();
  },

  getGamesByMonth: async (month: string): Promise<GameWithSong[]> => {
    const response = await fetch(`/api/admin/games?month=${month}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch games');
    }
    return response.json();
  },

  createOrUpdateGame: async ({ date, spotifyId }: { date: string; spotifyId: string }): Promise<GameWithSong> => {
    const response = await fetch(`/api/admin/games/${date}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create game');
    }
    return response.json();
  },

  deleteGame: async (date: string): Promise<void> => {
    const response = await fetch(`/api/admin/games/${date}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete game');
    }
  },

  searchTracks: async (query: string) => {
    const response = await fetch(`/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search tracks');
    }
    return response.json();
  },
};

export function useAdminGame(date: string) {
  return useQuery({
    queryKey: queryKeys.games.byDate(new Date(date)),
    queryFn: () => adminApi.getGame(date),
    enabled: !!date,
  });
}

export function useAdminGames(date?: Date) {
  const month = date ? format(date, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: queryKeys.games.byMonth(new Date(month)),
    queryFn: () => adminApi.getGamesByMonth(month),
  });
}

export function useAdminGameMutations() {
  const queryClient = useQueryClient();

  const createGame = useMutation({
    mutationFn: adminApi.createOrUpdateGame,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(new Date(data.date)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byMonth(new Date(data.date)) });
    },
  });

  const deleteGame = useMutation({
    mutationFn: adminApi.deleteGame,
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(new Date(date)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byMonth(new Date(date)) });
    },
  });

  return { createGame, deleteGame };
}

export function useSearchTracks() {
  return useMutation({
    mutationFn: adminApi.searchTracks,
  });
} 