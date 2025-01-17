import React, { useState } from 'react';
import { format } from 'date-fns';
import { AdminGame } from '@/types/admin';
import { GamePreview } from './game/GamePreview';
import { PlaylistBrowser } from './game/PlaylistBrowser';

interface GameEditorProps {
  selectedDate: Date;
  game?: AdminGame;
  onGameUpdate: () => void;
}

export function GameEditor({ selectedDate, game, onGameUpdate }: GameEditorProps) {
  const [mode, setMode] = useState<'preview' | 'playlist'>('preview');

  const handleSelectPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          playlistId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create/update game');
      }

      onGameUpdate();
      setMode('preview');
    } catch (error) {
      console.error('Failed to create/update game:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-foreground/10 p-4">
        <div className="text-lg font-mono">
          {format(selectedDate, 'MMMM d, yyyy')}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {mode === 'preview' ? (
          <div className="p-4">
            <GamePreview
              game={game}
              selectedDates={[selectedDate]}
              onSearchClick={() => setMode('playlist')}
              isMultiSelectMode={false}
              games={game ? [game] : []}
            />
          </div>
        ) : (
          <PlaylistBrowser
            onSelect={handleSelectPlaylist}
            onCancel={() => setMode('preview')}
          />
        )}
      </div>
    </div>
  );
} 