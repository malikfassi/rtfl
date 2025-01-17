import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { queryKeys } from '@/lib/query-client';

export function useGames(currentMonth: Date) {
  const month = format(currentMonth, 'yyyy-MM');
  const { data: games = [], isLoading } = useQuery({
    queryKey: queryKeys.games.byMonth(month),
    queryFn: async () => {
      const response = await fetch(`/api/admin/games?month=${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      return response.json();
    }
  });

  return { games, isLoading };
} 