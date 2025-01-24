import { useQuery } from '@tanstack/react-query';
import type { SimplifiedPlaylist, Track } from '@spotify/web-api-ts-sdk';

import { queryKeys } from '@/app/front/lib/query-client';

interface PlaylistsResponse {
  playlists: SimplifiedPlaylist[];
}

interface TracksResponse {
  tracks: Track[];
}

const adminApi = {
  searchPlaylists: async (query: string): Promise<SimplifiedPlaylist[]> => {
    const res = await fetch(`/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch playlists');
    }
    const data: PlaylistsResponse = await res.json();
    return data.playlists;
  },

  getPlaylistTracks: async (playlistId: string): Promise<Track[]> => {
    const res = await fetch(`/api/admin/spotify/playlists/${playlistId}/tracks`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch playlist tracks');
    }
    const data: TracksResponse = await res.json();
    return data.tracks;
  }
};

export function usePlaylists(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.playlists.search(query),
    queryFn: () => adminApi.searchPlaylists(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && query.length >= 2, // Only search when query is at least 2 chars
    retry: 1, // Only retry once
    retryDelay: 1000 // Wait 1 second before retrying
  });
}

export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlists', 'tracks', playlistId],
    queryFn: () => playlistId ? adminApi.getPlaylistTracks(playlistId) : Promise.resolve([]),
    enabled: !!playlistId,
    retry: 1,
    retryDelay: 1000
  });
} 