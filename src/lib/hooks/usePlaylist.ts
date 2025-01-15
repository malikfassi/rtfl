'use client';

import { useState, useCallback } from 'react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  trackCount: number;
}

interface SpotifyPlaylistResponse {
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    images: Array<{ url: string }>;
    totalTracks: number;
  }>;
}

interface UsePlaylistReturn {
  selectedPlaylistId: string | undefined;
  isLoading: boolean;
  error: Error | null;
  searchPlaylists: (query: string) => Promise<Playlist[]>;
  selectPlaylist: (id: string) => void;
}

export function usePlaylist(): UsePlaylistReturn {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchPlaylists = useCallback(async (query: string): Promise<Playlist[]> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/spotify/playlists/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to search playlists');
      }

      const data = await response.json() as SpotifyPlaylistResponse;
      return data.items.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        imageUrl: playlist.images?.[0]?.url ?? null,
        trackCount: playlist.totalTracks,
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectPlaylist = useCallback((id: string) => {
    setSelectedPlaylistId(id);
  }, []);

  return {
    selectedPlaylistId,
    isLoading,
    error,
    searchPlaylists,
    selectPlaylist,
  };
} 