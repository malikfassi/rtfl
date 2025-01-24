import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { queryKeys } from '@/app/front/lib/query-client';
import type { AdminGame } from '@/app/types/admin';

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
    queryKey: queryKeys.games.byMonth(date || new Date()),
    queryFn: () => adminApi.getGamesByMonth(month)
  });
}

export function useGamesByMonth(month: string) {
  return useQuery({
    queryKey: queryKeys.games.byMonth(new Date(month)),
    queryFn: () => adminApi.getGamesByMonth(month),
  });
} 