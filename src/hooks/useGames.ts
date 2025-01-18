import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import type { AdminGame } from '@/types/admin';
import { useCallback } from 'react';

export function useGames(currentMonth: Date) {
  const queryClient = useQueryClient();
  const month = format(currentMonth, 'yyyy-MM');
  const queryKey = ['games', 'month', month];

  const { data: games = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/admin/games?month=${month}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      
      // Normalize dates to YYYY-MM-DD format
      const normalizedData = data.map((g: AdminGame) => ({
        ...g,
        date: format(parseISO(g.date), 'yyyy-MM-dd')
      }));

      // Sort by date
      normalizedData.sort((a: AdminGame, b: AdminGame) => 
        a.date.localeCompare(b.date)
      );
      
      console.log('Month games data (first 4):', normalizedData.slice(0, 4).map((g: AdminGame) => ({
        date: g.date,
        spotifyId: g.song.spotifyId,
        title: g.song.title
      })));
      
      if (normalizedData.length > 4) {
        console.log(`...and ${normalizedData.length - 4} more games`);
      }
      
      return normalizedData;
    }
  });

  const setGames = useCallback((updater: (prev: AdminGame[]) => AdminGame[]) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryKey, queryClient]);

  return { games, isLoading, setGames };
} 