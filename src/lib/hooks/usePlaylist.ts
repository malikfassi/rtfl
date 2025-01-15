'use client';

import { useState } from 'react';

export type GameResponse = {
  id: string;
  date: string;
  playlistId: string;
  randomSeed: number;
  overrideSongId: string | null;
  playlist: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
  };
  selectedTrack: {
    id: string;
    name: string;
    artists: string[];
    previewUrl: string | null;
  };
};

export type UsePlaylistReturn = {
  playlists: Array<{ id: string; name: string }>;
  error: Error | null;
  searchPlaylists: (query: string) => Promise<void>;
  selectPlaylist: (playlistId: string) => Promise<void>;
  selectedPlaylistId: string | undefined;
  gameData: GameResponse | null;
};

export function usePlaylist(): UsePlaylistReturn {
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>();
  const [gameData, setGameData] = useState<GameResponse | null>(null);

  const searchPlaylists = async (query: string) => {
    if (!query) {
      setPlaylists([]);
      return;
    }

    try {
      const response = await fetch(`/api/spotify/playlists/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search playlists');
      }
      const data = await response.json();
      if (!data.items) {
        throw new Error('Failed to parse playlists');
      }
      setPlaylists(data.items);
      setError(null);
    } catch (err) {
      setPlaylists([]);
      setError(err instanceof Error ? err : new Error('Failed to search playlists'));
    }
  };

  const selectPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/spotify/playlists/${playlistId}`);
      if (!response.ok) {
        throw new Error('Failed to get playlist');
      }
      const data = await response.json();
      setSelectedPlaylistId(playlistId);
      setGameData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to select playlist'));
      throw err;
    }
  };

  return {
    playlists,
    error,
    searchPlaylists,
    selectPlaylist,
    selectedPlaylistId,
    gameData,
  };
} 