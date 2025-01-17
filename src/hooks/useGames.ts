import { useState, useEffect } from 'react';
import { AdminGame } from '@/types/admin';
import { format } from 'date-fns';

export function useGames(currentMonth: Date) {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchGames() {
      try {
        setIsLoading(true);
        const month = format(currentMonth, 'yyyy-MM');
        const response = await fetch(`/api/admin/games?month=${month}`);
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGames();
  }, [currentMonth]);

  return { games, isLoading };
} 