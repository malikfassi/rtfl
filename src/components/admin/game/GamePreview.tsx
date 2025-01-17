import React, { useState } from 'react';
import { AdminGame } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GamePreviewProps {
  game?: AdminGame;
  date: Date;
  onSearchClick: () => void;
  isUpdating?: boolean;
}

export function GamePreview({ game, date, onSearchClick, isUpdating = false }: GamePreviewProps) {
  const [showMasked, setShowMasked] = useState(false);

  if (!game) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl font-mono">No game for {format(date, 'MM.dd.yyyy')}</div>
          <Button 
            onClick={onSearchClick}
            disabled={isUpdating}
          >
            Create Game
          </Button>
        </div>
      </div>
    );
  }

  // Debug log to see the actual structure
  console.log('Game song data:', game.song);

  // Safely handle maskedLyrics and ensure arrays
  const maskedLyrics = {
    title: Array.isArray(game.song.maskedLyrics?.title) ? game.song.maskedLyrics.title : [game.song.maskedLyrics?.title || ''],
    artist: Array.isArray(game.song.maskedLyrics?.artist) ? game.song.maskedLyrics.artist : [game.song.maskedLyrics?.artist || ''],
    lyrics: Array.isArray(game.song.maskedLyrics?.lyrics) ? game.song.maskedLyrics.lyrics : [game.song.maskedLyrics?.lyrics || '']
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="game-header">{format(new Date(game.date), 'MM.dd.yyyy')}</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowMasked(!showMasked)}
          >
            {showMasked ? 'Show Original' : 'Show Masked'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={onSearchClick}
            disabled={isUpdating}
          >
            Change Song
          </Button>
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-hidden",
        isUpdating && "opacity-50 pointer-events-none"
      )}>
        <div className="h-full flex flex-col space-y-8 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted">Title</div>
              <div className="text-lg">
                {showMasked ? maskedLyrics.title.join(' ') : game.song.title}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted">Artist</div>
              <div className="text-lg">
                {showMasked ? maskedLyrics.artist.join(' ') : game.song.artist}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted">Lyrics</div>
              <div className="whitespace-pre-wrap font-mono">
                {showMasked ? maskedLyrics.lyrics.join(' ') : game.song.lyrics}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-spin text-2xl">⟳</div>
        </div>
      )}
    </div>
  );
} 