import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Query keys for better type safety and consistency
export const queryKeys = {
  games: {
    all: ['games'] as const,
    byMonth: (month: string) => [...queryKeys.games.all, 'month', month] as const,
    byDate: (date: string) => [...queryKeys.games.all, 'date', date] as const,
  },
  playlists: {
    all: ['playlists'] as const,
    search: (query: string) => [...queryKeys.playlists.all, 'search', query] as const,
    tracks: (playlistId: string) => ['playlists', playlistId, 'tracks'] as const,
  }
} as const; 