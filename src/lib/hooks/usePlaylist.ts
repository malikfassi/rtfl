'use client';

import { useState } from 'react';
import { format } from 'date-fns';

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
    lyrics?: string | null;
  };
};

export type UsePlaylistReturn = {
  playlists: Array<{ id: string; name: string }>;
  error: Error | null;
  searchPlaylists: (query: string) => Promise<void>;
  selectPlaylist: (playlistId: string) => Promise<void>;
  gameData: GameResponse | null;
  refreshGameData: () => Promise<void>;
};

export function usePlaylist(): UsePlaylistReturn {
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<Error | null>(null);
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

  const selectPlaylist = async (_playlistId: string) => {
    try {
      const response = await fetch(`/api/admin/games/${format(new Date(), 'yyyy-MM-dd')}`);
      if (!response.ok) {
        throw new Error('Failed to get game data');
      }
      const data = await response.json();
      setGameData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to select playlist'));
      throw err;
    }
  };

  const refreshGameData = async () => {
    try {
      const response = await fetch(`/api/admin/games/${format(new Date(), 'yyyy-MM-dd')}`);
      if (!response.ok) {
        throw new Error('Failed to refresh game data');
      }
      const data = await response.json();
      setGameData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh game data'));
      throw err;
    }
  };

  return {
    playlists,
    error,
    searchPlaylists,
    selectPlaylist,
    gameData,
    refreshGameData,
  };
} 