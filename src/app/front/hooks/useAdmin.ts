import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
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
    queryKey: queryKeys.games.byDate(date),
    queryFn: () => adminApi.getGame(date),
    enabled: !!date,
  });
}

export function useAdminGames(date?: Date) {
  const month = date ? format(date, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: queryKeys.games.byMonth(month),
    queryFn: () => adminApi.getGamesByMonth(month),
  });
}

export function useAdminGameMutations() {
  const queryClient = useQueryClient();

  const createGame = useMutation({
    mutationFn: adminApi.createOrUpdateGame,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(data.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byMonth(data.date.slice(0, 7)) });
    },
  });

  const deleteGame = useMutation({
    mutationFn: adminApi.deleteGame,
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byMonth(date.slice(0, 7)) });
    },
  });

  return { createGame, deleteGame };
}

export function useSearchTracks() {
  return useMutation({
    mutationFn: adminApi.searchTracks,
  });
}

export function useAdminGamesWithSurroundingMonths(date?: Date) {
  const current = date ? new Date(date) : new Date();
  const prev = addMonths(current, -1);
  const next = addMonths(current, 1);
  const months = [prev, current, next].map(d => format(d, 'yyyy-MM'));

  return useQuery({
    queryKey: ['games', 'surrounding', ...months],
    queryFn: async () => {
      const results = await Promise.all(months.map(m => adminApi.getGamesByMonth(m)));
      // Flatten and deduplicate by game.date
      const allGames = results.flat();
      const seen = new Set<string>();
      return allGames.filter(g => {
        if (seen.has(g.date)) return false;
        seen.add(g.date);
        return true;
      });
    },
  });
} 