'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlaylist } from '@/lib/hooks/usePlaylist';
import { PlaylistBrowser } from './PlaylistBrowser';
import { PlaylistSongBrowser } from './PlaylistSongBrowser';
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

type BrowserMode = 'none' | 'playlist' | 'song';

export function GameEditor({ date, gameData: initialGameData }: GameEditorProps) {
  const {
    error: playlistError,
    searchPlaylists,
    selectPlaylist,
    selectedPlaylistId,
    gameData: playlistData,
    playlists,
    refreshGameData
  } = usePlaylist();

  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [overrideSongId, setOverrideSongId] = useState<string>(initialGameData?.overrideSongId || '');
  const [browserMode, setBrowserMode] = useState<BrowserMode>('none');

  // Keep overrideSongId in sync with initialGameData
  useEffect(() => {
    setOverrideSongId(initialGameData?.overrideSongId || '');
  }, [initialGameData?.overrideSongId]);

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

      // After successful save, refresh game data and select the playlist
      await refreshGameData();
      await selectPlaylist(playlistId);
      setBrowserMode('none');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save game'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSongSelect = async (songId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: initialGameData!.playlistId,
          overrideSongId: songId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update override song');
      }

      // After successful save, refresh game data
      await refreshGameData();
      setOverrideSongId(songId);
      setBrowserMode('none');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update override song'));
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

      // After successful delete, refresh game data
      await refreshGameData();
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

      // After successful save, refresh game data
      await refreshGameData();
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
                <button
                  onClick={() => setBrowserMode(browserMode === 'playlist' ? 'none' : 'playlist')}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  {initialGameData?.playlistId ?? '<Select from browser below>'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Override Song ID:</span>
                <button
                  onClick={() => setBrowserMode(browserMode === 'song' ? 'none' : 'song')}
                  disabled={!initialGameData}
                  className="ml-2 text-blue-500 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {overrideSongId || 'None'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">Selected Song</h4>
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <span className="ml-2">{playlistData?.selectedTrack?.name ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">ID:</span>
                <span className="ml-2">{playlistData?.selectedTrack?.id ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Artists:</span>
                <span className="ml-2">{playlistData?.selectedTrack?.artists?.join(', ') ?? 'N/A'}</span>
              </div>
              {playlistData?.selectedTrack?.previewUrl && (
                <audio controls src={playlistData.selectedTrack.previewUrl} className="w-full" />
              )}
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

      {browserMode === 'playlist' && (
        <PlaylistBrowser
          onSearch={handleSearch}
          onSelect={handlePlaylistSelect}
          selectedPlaylistId={selectedPlaylistId}
          gameData={playlistData}
          playlists={playlists}
          isLoading={isSearching}
        />
      )}

      {browserMode === 'song' && initialGameData && (
        <PlaylistSongBrowser
          playlistId={initialGameData.playlistId}
          onSelect={handleSongSelect}
          selectedSongId={overrideSongId || undefined}
          isLoading={isSaving}
        />
      )}
    </div>
  );
} 