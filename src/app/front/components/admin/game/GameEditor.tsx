import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React, { useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import type { AdminGame } from '@/app/types/admin';

import { GamePreview } from './GamePreview';
import { SongBrowser } from './SongBrowser';

export type EditorMode = 'preview' | 'search';

interface GameEditorProps {
  selectedDate: Date;
  game?: AdminGame;
  onGameUpdate: (newGame?: AdminGame) => Promise<void>;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function GameEditor({ selectedDate, game, onGameUpdate, mode, onModeChange }: GameEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false);

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

  if (!selectedDate) {
    return <div>Please select a date</div>;
  }

  return (
    <div className="p-4">
      {mode === 'preview' ? (
        game ? (
          <GamePreview
            game={game}
            date={selectedDate}
            onSearchClick={() => onModeChange('search')}
            isUpdating={isUpdating}
          />
        ) : (
          <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm text-gray-500">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </span>
                <h2 className="text-xl font-semibold">No song selected</h2>
              </div>
              <Button
                variant="primary"
                onClick={() => onModeChange('search')}
                disabled={isUpdating}
              >
                Add Song
              </Button>
            </div>
          </div>
        )
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