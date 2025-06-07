import { useQuery } from '@tanstack/react-query';

interface GameStats {
  date: string;
  totalPlayers: number;
  averageGuesses: number;
  averageLyricsCompletionForWinners: number;
  difficultyScore: number;
}

export function useGameStats(date: string, enabled: boolean = true) {
  return useQuery<GameStats>({
    queryKey: ['gameStats', date],
    queryFn: async () => {
      const response = await fetch(`/api/games/stats?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game stats');
      }
      return response.json();
    },
    enabled: enabled && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });
} 