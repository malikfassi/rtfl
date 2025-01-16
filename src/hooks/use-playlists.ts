import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { Playlist, SpotifyTrack } from '@/types/admin';

const adminApi = {
  searchPlaylists: async (query: string): Promise<Playlist[]> => {
    const res = await fetch(`/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch playlists');
    return res.json();
  },

  getPlaylistTracks: async (playlistId: string): Promise<SpotifyTrack[]> => {
    const res = await fetch(`/api/admin/spotify/playlists/${playlistId}/tracks`);
    if (!res.ok) throw new Error('Failed to fetch playlist tracks');
    return res.json();
  }
};

export function usePlaylists(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.playlists.search(query),
    queryFn: () => adminApi.searchPlaylists(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && query.length >= 2 // Only search when query is at least 2 chars
  });
}

export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: playlistId ? queryKeys.playlists.tracks(playlistId) : ['playlists', 'tracks', null],
    queryFn: () => adminApi.getPlaylistTracks(playlistId!),
    enabled: !!playlistId
  });
} 