'use client';

import { useState, useCallback } from 'react';
import { usePlaylist } from '@/lib/hooks/usePlaylist';
import { PlaylistBrowser } from './PlaylistBrowser';
import { format } from 'date-fns';

interface GameEditorProps {
  date: Date;
  gameData: {
    id: number;
    date: Date;
    playlistId: string;
    randomSeed: number;
    overrideSongId: string | null;
  } | null;
}

export function GameEditor({ date, gameData: initialGameData }: GameEditorProps) {
  const {
    error: playlistError,
    searchPlaylists,
    selectPlaylist,
    selectedPlaylistId,
    gameData: playlistData,
    playlists
  } = usePlaylist();

  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [overrideSongId, setOverrideSongId] = useState<string>(initialGameData?.overrideSongId || '');

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      return;
    }
    setIsSearching(true);
    try {
      await searchPlaylists(query);
    } finally {
      setIsSearching(false);
    }
  }, [searchPlaylists]);

  const handlePlaylistSelect = async (playlistId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      // Create or update game when playlist is selected
      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: initialGameData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId,
          overrideSongId: overrideSongId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save game');
      }

      // After successful save, select the playlist to update the UI
      await selectPlaylist(playlistId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save game'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialGameData) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete game');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete game'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateRandomSeed = async () => {
    if (!initialGameData) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: initialGameData.playlistId,
          overrideSongId: overrideSongId || null,
          regenerateRandomSeed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate random seed');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to regenerate random seed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error.message}
        </div>
      )}
      {playlistError && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {playlistError.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Game Data</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">From Database</h4>
              <div>
                <span className="text-sm text-gray-500">Game ID:</span>
                <span className="ml-2">{initialGameData?.id ?? '<Generated after creation>'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Random Seed:</span>
                <span>{initialGameData?.randomSeed ?? '<Generated after creation>'}</span>
                {initialGameData && (
                  <button
                    onClick={handleRegenerateRandomSeed}
                    disabled={isSaving}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Regenerate
                  </button>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Playlist ID:</span>
                <span className="ml-2">{initialGameData?.playlistId ?? '<Select from browser below>'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Override Song ID:</span>
                <input
                  type="text"
                  value={overrideSongId}
                  onChange={(e) => setOverrideSongId(e.target.value)}
                  placeholder="None"
                  className="ml-2 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">Computed Data</h4>
              <div>
                <span className="text-sm text-gray-500">Selected Song Name:</span>
                <span className="ml-2">{playlistData?.selectedTrack?.name ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Selected Song ID:</span>
                <span className="ml-2">{playlistData?.selectedTrack?.id ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Artists:</span>
                <span className="ml-2">{playlistData?.selectedTrack?.artists?.join(', ') ?? 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-600 mb-2">From Cache</h4>
            <div>
              <span className="text-sm text-gray-500">Playlist Name:</span>
              <span className="ml-2">{playlistData?.playlist?.name ?? 'N/A'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Playlist Description:</span>
              <span className="ml-2">{playlistData?.playlist?.description ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {initialGameData && (
        <div>
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            Delete Game
          </button>
        </div>
      )}

      <PlaylistBrowser
        onSearch={handleSearch}
        onSelect={handlePlaylistSelect}
        selectedPlaylistId={selectedPlaylistId}
        gameData={playlistData}
        playlists={playlists}
        isLoading={isSearching}
      />
    </div>
  );
} 