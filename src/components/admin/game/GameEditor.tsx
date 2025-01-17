import React, { useState } from 'react';
import { AdminGame } from '@/types/admin';
import { SongBrowser } from './SongBrowser';
import { GamePreview } from './GamePreview';
import { format } from 'date-fns';
import { useGameMutations } from '@/hooks/use-game-mutations';
import { SpotifyTrack } from '@/lib/clients/spotify';

interface GameEditorProps {
  game?: AdminGame;
  onGameUpdate: () => Promise<void>;
  selectedDate?: Date;
}

export function GameEditor({ game, onGameUpdate, selectedDate }: GameEditorProps) {
  const [mode, setMode] = useState<'preview' | 'search'>('preview');
  const [isUpdating, setIsUpdating] = useState(false);
  const { createOrUpdateGame } = useGameMutations();

  const handleSelectSong = async (track: SpotifyTrack) => {
    if (!selectedDate) return;
    
    try {
      setIsUpdating(true);
      await createOrUpdateGame({
        date: format(selectedDate, 'yyyy-MM-dd'),
        spotifyId: track.spotifyId
      });
      await onGameUpdate();
      setMode('preview');
    } catch (error) {
      console.error('Error updating game:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!selectedDate) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        Select a date to edit
      </div>
    );
  }

  return (
    <div className="h-full">
      {mode === 'preview' ? (
        <GamePreview
          game={game}
          date={selectedDate}
          onSearchClick={() => setMode('search')}
          isUpdating={isUpdating}
        />
      ) : (
        <SongBrowser
          onSelect={handleSelectSong}
          disabled={isUpdating}
        />
      )}
    </div>
  );
} 