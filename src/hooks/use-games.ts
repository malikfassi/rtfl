import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminGame } from '@/types/admin';
import { format } from 'date-fns';

const adminApi = {
  getGamesByMonth: async (month: string): Promise<AdminGame[]> => {
    const res = await fetch(`/api/admin/games?month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch games');
    return res.json();
  }
};

export function useGames(date: Date | undefined) {
  const month = date ? format(date, 'yyyy-MM') : format(new Date(), 'yyyy-MM');

  return useQuery({
    queryKey: queryKeys.games.byMonth(month),
    queryFn: () => adminApi.getGamesByMonth(month)
  });
} 