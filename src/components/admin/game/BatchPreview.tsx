import React from 'react';
import { format } from 'date-fns';
import { AdminGame } from '@/types/admin';
import { Button } from '@/components/ui/Button';

interface BatchPreviewProps {
  dates: Date[];
  games: AdminGame[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchPreview({ dates, games, onConfirm, onCancel }: BatchPreviewProps) {
  return (
    <div className="flex flex-col h-full p-8">
      <div className="mb-8">
        <h2 className="game-header">Preview Changes</h2>
        <div className="text-muted">
          {dates.length} dates selected • {games.length} games to be created
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          {dates.map((date, index) => {
            const game = games.find(g => g.date === format(date, 'yyyy-MM-dd'));
            return (
              <div key={index} className="p-4 border border-foreground/10 rounded-lg">
                <div className="font-mono mb-2">{format(date, 'MM.dd.yyyy')}</div>
                {game ? (
                  <>
                    <div className="text-lg">{game.song.title}</div>
                    <div className="text-sm text-muted">{game.song.artist}</div>
                  </>
                ) : (
                  <div className="text-sm text-muted">Loading preview...</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          Confirm Changes
        </Button>
      </div>
    </div>
  );
} 