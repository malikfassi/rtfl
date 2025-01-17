import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { queryKeys } from '@/lib/query-client';
import type { AdminGame } from '@/types/admin';

export function useGames(currentMonth: Date) {
  const queryClient = useQueryClient();
  const month = format(currentMonth, 'yyyy-MM');
  const queryKey = queryKeys.games.byMonth(month);

  const { data: games = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/admin/games?month=${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      return response.json();
    }
  });

  const setGames = (updater: (prev: AdminGame[]) => AdminGame[]) => {
    queryClient.setQueryData(queryKey, updater);
  };

  return { games, isLoading, setGames };
} 