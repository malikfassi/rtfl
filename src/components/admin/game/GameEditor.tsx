import React, { useState } from 'react';
import { SongBrowser } from './SongBrowser';
import { GamePreview } from './GamePreview';
import type { AdminGame } from '@/types/admin';
import type { SpotifyTrack } from '@/types/spotify';

export type EditorMode = 'preview' | 'search';

interface GameEditorProps {
  selectedDate: Date;
  game?: AdminGame;
  onGameUpdate: () => Promise<void>;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function GameEditor({ selectedDate, game, onGameUpdate, mode, onModeChange }: GameEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectSong = async (track: SpotifyTrack) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          spotifyId: track.spotifyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      await onGameUpdate();
      onModeChange('preview');
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!selectedDate) {
    return <div>Please select a date</div>;
  }

  return (
    <div className="p-4">
      {mode === 'preview' ? (
        <GamePreview
          game={game}
          date={selectedDate}
          onSearchClick={() => onModeChange('search')}
          isUpdating={isUpdating}
        />
      ) : (
        <SongBrowser
          onSelect={handleSelectSong}
          onCancel={() => onModeChange('preview')}
          disabled={isUpdating}
        />
      )}
    </div>
  );
} 