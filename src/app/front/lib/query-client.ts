import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  games: {
    all: ['games'] as const,
    byMonth: (month: Date) => [...queryKeys.games.all, month] as const,
    byDate: (date: Date) => [...queryKeys.games.all, 'byDate', date] as const,
  },
  playlists: {
    all: ['playlists'] as const,
    search: (query: string) => [...queryKeys.playlists.all, 'search', query] as const,
    tracks: (id: string) => [...queryKeys.playlists.all, 'tracks', id] as const,
  },
} as const; 