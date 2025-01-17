import React, { useState } from 'react';
import { format } from 'date-fns';
import { AdminGame } from '@/types/admin';
import { GamePreview } from './GamePreview';
import { PlaylistBrowser } from './PlaylistBrowser';
import { Button } from '@/components/ui/Button';

interface GameEditorProps {
  selectedDate?: Date;
  game?: AdminGame;
  onGameUpdate: () => void;
}

export function GameEditor({ selectedDate, game, onGameUpdate }: GameEditorProps) {
  const [mode, setMode] = useState<'preview' | 'search'>('preview');

  const handleSelectSong = async (spotifyId: string) => {
    if (!selectedDate) return;

    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          spotifyId
        })
      });

      if (!response.ok) throw new Error('Failed to create/update game');
      
      onGameUpdate();
      setMode('preview');
    } catch (error) {
      console.error('Failed to create/update game:', error);
    }
  };

  if (!selectedDate) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        Select a date to edit
      </div>
    );
  }

  if (mode === 'search') {
    return (
      <PlaylistBrowser
        onSelect={handleSelectSong}
        onCancel={() => setMode('preview')}
      />
    );
  }

  return (
    <div className="h-full">
      {game ? (
        <GamePreview 
          game={game}
          onSearchClick={() => setMode('search')}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-xl font-mono">No game for {format(selectedDate, 'MM.dd.yyyy')}</div>
            <Button onClick={() => setMode('search')}>
              Create Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 