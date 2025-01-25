import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React, { useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import type { AdminGame, GameStatusInfo } from '@/app/types/admin';

import { GamePreview } from './GamePreview';
import { SongBrowser } from './SongBrowser';

export type EditorMode = 'preview' | 'search';

interface GameEditorProps {
  selectedDate?: Date;
  game?: AdminGame;
  onGameUpdate: (newGame?: AdminGame) => Promise<void>;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onGameDelete?: (date: string) => Promise<void>;
  onRandomSongAssign?: (date: Date) => void;
  selectedPlaylist?: { tracks: Track[] };
  onPlaylistChange?: (playlist: { tracks: Track[] }) => void;
  pendingChange?: GameStatusInfo;
}

export function GameEditor({ 
  selectedDate, 
  game, 
  onGameUpdate, 
  mode, 
  onModeChange,
  onGameDelete,
  onRandomSongAssign,
  selectedPlaylist,
  onPlaylistChange,
  pendingChange
}: GameEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!selectedDate) {
    return (
      <div className="p-4 text-center text-muted">
        Select a date to edit
      </div>
    );
  }

  const handleSelectSong = async (track: Track) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          spotifyId: track.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const updatedGame = await response.json();
      
      await onGameUpdate(updatedGame);
      onModeChange('preview');
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onGameDelete) return;
    setIsUpdating(true);
    try {
      await onGameDelete(format(selectedDate, 'yyyy-MM-dd'));
      onModeChange('preview');
    } catch (error) {
      console.error('Error deleting game:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRandomSong = () => {
    if (onRandomSongAssign) {
      onRandomSongAssign(selectedDate);
    }
  };

  if (mode === 'search') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Select Song</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onModeChange('preview')}
            disabled={isUpdating}
          >
            Cancel
          </Button>
        </div>

        <SongBrowser
          onSelect={handleSelectSong}
          onCancel={() => onModeChange('preview')}
          disabled={isUpdating}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {format(selectedDate, 'MMMM d, yyyy')}
        </h2>
        <div className="space-x-2">
          {game && onGameDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              Delete
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onModeChange('search')}
            disabled={isUpdating}
          >
            {game ? 'Change Song' : 'Add Song'}
          </Button>
        </div>
      </div>

      {selectedPlaylist && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted">
            Selected Playlist: {selectedPlaylist.tracks.length} tracks
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRandomSong}
            disabled={!selectedPlaylist.tracks.length}
          >
            Random Song
          </Button>
        </div>
      )}

      {game && (
        <GamePreview 
          game={game} 
          date={selectedDate}
          onSearchClick={() => onModeChange('search')}
          isUpdating={isUpdating}
        />
      )}

      {pendingChange && (
        <div className="p-4 bg-yellow-50 rounded">
          <div className="text-sm font-medium text-yellow-800">
            Pending Changes
          </div>
          {pendingChange.newSong && (
            <div className="mt-2 text-sm text-yellow-700">
              <div>New Song: {pendingChange.newSong.name}</div>
              <div>Artist: {pendingChange.newSong.artists[0]?.name}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 