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
    gameData: playlistData,
    playlists,
    refreshGameData
  } = usePlaylist();

  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [overrideSongId, setOverrideSongId] = useState<string>(initialGameData?.overrideSongId || '');
  const [browserMode, setBrowserMode] = useState<BrowserMode>('none');
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Keep overrideSongId in sync with initialGameData
  useEffect(() => {
    setOverrideSongId(initialGameData?.overrideSongId || '');
  }, [initialGameData?.overrideSongId]);

  // Fetch lyrics when song changes
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!playlistData?.selectedTrack) return;
      
      setIsLoadingLyrics(true);
      try {
        const response = await fetch(`/api/genius/lyrics?artist=${encodeURIComponent(playlistData.selectedTrack.artists[0])}&title=${encodeURIComponent(playlistData.selectedTrack.name)}`);
        if (!response.ok) throw new Error('Failed to fetch lyrics');
        const data = await response.json();
        setLyrics(data.lyrics);
      } catch (err) {
        console.error('Failed to fetch lyrics:', err);
        setLyrics(null);
      } finally {
        setIsLoadingLyrics(false);
      }
    };

    fetchLyrics();
  }, [playlistData?.selectedTrack]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query) return;
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

      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: initialGameData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId,
          overrideSongId: overrideSongId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save game');

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

      if (!response.ok) throw new Error('Failed to update override song');

      await refreshGameData();
      setOverrideSongId(songId);
      setBrowserMode('none');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update override song'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseRandomSeed = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: initialGameData!.playlistId,
          overrideSongId: null,
        }),
      });

      if (!response.ok) throw new Error('Failed to clear override song');

      await refreshGameData();
      setOverrideSongId('');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear override song'));
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

      if (!response.ok) throw new Error('Failed to delete game');

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

      if (!response.ok) throw new Error('Failed to regenerate random seed');

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

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-lg font-semibold">Game Configuration</h3>
          {initialGameData && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm"
            >
              Delete Game
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Game Data */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-600">Game Data</h4>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Game ID:</span>
                <span className="ml-2 font-mono">{initialGameData?.id ?? '<Generated after creation>'}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Random Seed:</span>
                  <span className="font-mono">{initialGameData?.randomSeed ?? '<Generated after creation>'}</span>
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
              </div>

              <div>
                <span className="text-sm text-gray-500">Playlist:</span>
                <button
                  onClick={() => setBrowserMode(browserMode === 'playlist' ? 'none' : 'playlist')}
                  className="ml-2 text-blue-500 hover:underline block"
                >
                  {playlistData?.playlist?.name ?? initialGameData?.playlistId ?? '<Select from browser below>'}
                </button>
                <span className="text-xs text-gray-400 ml-2">ID: {initialGameData?.playlistId ?? 'N/A'}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Selected Song:</span>
                  <button
                    onClick={() => setBrowserMode(browserMode === 'song' ? 'none' : 'song')}
                    disabled={!initialGameData}
                    className="text-blue-500 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {overrideSongId ? 'Change Override' : 'Set Override'}
                  </button>
                  {overrideSongId && (
                    <button
                      onClick={handleUseRandomSeed}
                      disabled={isSaving}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Use Random Seed
                    </button>
                  )}
                </div>
                {playlistData?.selectedTrack && (
                  <div className="mt-1 text-sm text-gray-600">
                    {playlistData.selectedTrack.name} - {playlistData.selectedTrack.artists.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Song Preview */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-600">Song Preview</h4>
            
            {playlistData?.selectedTrack ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">{playlistData.selectedTrack.name}</h5>
                  <p className="text-sm text-gray-600 mb-4">by {playlistData.selectedTrack.artists.join(', ')}</p>
                  {playlistData.selectedTrack.previewUrl ? (
                    <audio 
                      controls 
                      src={playlistData.selectedTrack.previewUrl} 
                      className="w-full"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No preview available</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Lyrics</h5>
                  {isLoadingLyrics ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  ) : lyrics ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 max-h-48 overflow-y-auto">
                      {lyrics}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500">No lyrics available</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No song selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browser Section */}
      {browserMode !== 'none' && (
        <div className="bg-white rounded-lg shadow p-6">
          {browserMode === 'playlist' ? (
            <PlaylistBrowser
              onSearch={handleSearch}
              onSelect={handlePlaylistSelect}
              selectedPlaylistId={initialGameData?.playlistId}
              gameData={playlistData}
              playlists={playlists}
              isLoading={isSearching || isSaving}
            />
          ) : (
            initialGameData && (
              <PlaylistSongBrowser
                playlistId={initialGameData.playlistId}
                onSelect={handleSongSelect}
                selectedSongId={overrideSongId}
                isLoading={isSaving}
              />
            )
          )}
        </div>
      )}
    </div>
  );
} 