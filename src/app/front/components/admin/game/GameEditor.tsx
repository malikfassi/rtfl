import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React, { useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import type { AdminGame, GameStatusInfo } from '@/app/types/admin';
import { useToast } from '@/app/front/hooks/use-toast';

import { SongBrowser } from './SongBrowser';
import { LyricsGame } from '../../game/LyricsGame';

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
  const { toast } = useToast();

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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to create game (${response.status})`;
        throw new Error(errorMessage);
      }

      const updatedGame = await response.json();
      
      await onGameUpdate(updatedGame);
      onModeChange('preview');
      
      toast({
        title: "Success",
        description: `Game created for ${format(selectedDate, 'MMM d, yyyy')}`,
      });
    } catch (error) {
      console.error('Error creating game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Failed to create game",
        description: errorMessage,
        variant: "destructive",
      });
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
      
      toast({
        title: "Game deleted",
        description: `Game for ${format(selectedDate, 'MMM d, yyyy')} has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete game';
      
      toast({
        title: "Failed to delete game",
        description: errorMessage,
        variant: "destructive",
      });
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
            {game ? 'Change Song' : 'Choose Song'}
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

      {mode === 'preview' && (
        <div className="relative">
          <LyricsGame
            date={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
            game={undefined}
            disabled={!game}
            isAdmin={true}
            onChooseSong={() => onModeChange('search')}
            hideChooseSongButton
          />
        </div>
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