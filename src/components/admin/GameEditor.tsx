'use client';

import { useState } from 'react';
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
    gameData,
    playlists
  } = usePlaylist();

  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      await searchPlaylists(query);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/games/${format(date, 'yyyy-MM-dd')}`, {
        method: initialGameData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId: selectedPlaylistId,
          randomSeed: Math.floor(Math.random() * 1000000),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save game');
      }
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
        
        {initialGameData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-600">From Database</h4>
                <div>
                  <span className="text-sm text-gray-500">Game ID:</span>
                  <span className="ml-2">{initialGameData.id}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Random Seed:</span>
                  <span className="ml-2">{initialGameData.randomSeed}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Playlist ID:</span>
                  <span className="ml-2">{initialGameData.playlistId}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Override Song ID:</span>
                  <span className="ml-2">{initialGameData.overrideSongId || 'None'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-600">Computed Data</h4>
                <div>
                  <span className="text-sm text-gray-500">Selected Song Name:</span>
                  <span className="ml-2">{gameData?.selectedTrack?.name ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Selected Song ID:</span>
                  <span className="ml-2">{gameData?.selectedTrack?.id ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Artists:</span>
                  <span className="ml-2">{gameData?.selectedTrack?.artists?.join(', ') ?? 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-600 mb-2">From Cache</h4>
              <div>
                <span className="text-sm text-gray-500">Playlist Name:</span>
                <span className="ml-2">{gameData?.playlist?.name ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Playlist Description:</span>
                <span className="ml-2">{gameData?.playlist?.description ?? 'N/A'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic">
            No game exists for this date. Create one below.
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !selectedPlaylistId}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : initialGameData ? 'Update Game' : 'Create Game'}
        </button>

        {initialGameData && (
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            Delete Game
          </button>
        )}
      </div>

      <PlaylistBrowser
        onSearch={handleSearch}
        onSelect={selectPlaylist}
        selectedPlaylistId={selectedPlaylistId}
        gameData={gameData}
        playlists={playlists}
        isLoading={isSearching}
      />
    </div>
  );
} 