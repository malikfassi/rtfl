'use client';

import { useState, useEffect } from 'react';
import type { Game } from '@prisma/client';
import { format } from 'date-fns';
import { PlaylistBrowser } from './PlaylistBrowser';
import { usePlaylist } from '@/lib/hooks/usePlaylist';

interface GameEditorProps {
  date: Date;
  game: Game | null;
  onSave: (date: string, playlistId: string) => Promise<void>;
  onDelete: (date: string) => Promise<void>;
  onRefreshSeed: (date: string) => Promise<void>;
  isLoading?: boolean;
}

export function GameEditor({
  date,
  game,
  onSave,
  onDelete,
  onRefreshSeed,
  isLoading = false,
}: GameEditorProps) {
  const {
    selectedPlaylistId,
    isLoading: playlistsLoading,
    error: playlistsError,
    searchPlaylists,
    selectPlaylist,
  } = usePlaylist();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial playlist selection if game exists
  useEffect(() => {
    if (game) {
      selectPlaylist(game.playlistId);
    } else {
      selectPlaylist('');
    }
  }, [game, selectPlaylist]);

  const handleSave = async () => {
    if (!selectedPlaylistId) {
      setError('Please select a playlist');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(format(date, 'yyyy-MM-dd'), selectedPlaylistId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!game) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await onDelete(format(date, 'yyyy-MM-dd'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshSeed = async () => {
    if (!game) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await onRefreshSeed(format(date, 'yyyy-MM-dd'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh seed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {game ? 'Edit Game' : 'Create Game'} - {format(date, 'MMMM d, yyyy')}
        </h2>
      </div>

      <div className="space-y-6">
        <PlaylistBrowser
          selectedPlaylistId={selectedPlaylistId}
          onSearch={searchPlaylists}
          onSelect={selectPlaylist}
          isLoading={playlistsLoading}
          error={playlistsError}
        />

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving || !selectedPlaylistId}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : (game ? 'Update Game' : 'Create Game')}
          </button>

          {game && (
            <>
              <button
                onClick={handleRefreshSeed}
                disabled={isLoading || isSaving}
                className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh Seed
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || isSaving}
                className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Game
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 