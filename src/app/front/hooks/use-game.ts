import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/app/front/lib/query-client';
import type { AdminGame } from '@/app/types/admin';

const adminApi = {
  getGame: async (date: string): Promise<AdminGame | null> => {
    const res = await fetch(`/api/admin/games?date=${date}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch game');
    return res.json();
  }
};

export function useGame(date: string | null) {
  return useQuery({
    queryKey: date ? queryKeys.games.byDate(new Date(date)) : ['games', 'date', null],
    queryFn: () => adminApi.getGame(date!),
    enabled: !!date
  });
} 