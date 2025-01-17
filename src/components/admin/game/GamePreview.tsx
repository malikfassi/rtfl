import React from 'react';
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

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="game-header">{format(new Date(game.date), 'MM.dd.yyyy')}</h2>
        <Button 
          variant="secondary" 
          onClick={onSearchClick}
          disabled={isUpdating}
        >
          Change Song
        </Button>
      </div>

      <div className={cn(
        "flex-1",
        isUpdating && "opacity-50 pointer-events-none"
      )}>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted">Title</div>
            <div className="text-lg">{game.song.title}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Artist</div>
            <div className="text-lg">{game.song.artist}</div>
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