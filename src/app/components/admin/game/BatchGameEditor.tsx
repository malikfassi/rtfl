import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { Track } from '@spotify/web-api-ts-sdk';
import { GameStatus, GameStatusInfo } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { PlaylistBrowser } from './PlaylistBrowser';
import { useGameMutations } from '@/hooks/use-game-mutations';

interface BatchGameEditorProps {
  selectedDates: Date[];
  games: Array<{
    date: string;
    song: {
      id: string;
      title: string;
      artist: string;
    };
  }>;
  pendingChanges: Record<string, GameStatusInfo>;
  onPendingChanges: (changes: Record<string, GameStatusInfo> | ((prev: Record<string, GameStatusInfo>) => Record<string, GameStatusInfo>)) => void;
  onComplete: () => void;
  onPlaylistChange?: (playlist: { tracks: Track[] }) => void;
  onReshuffle?: () => void;
}

export function BatchGameEditor({ 
  selectedDates, 
  pendingChanges,
  onPendingChanges,
  onComplete,
  onPlaylistChange,
  onReshuffle
}: BatchGameEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { createOrUpdateGame } = useGameMutations();

  const handlePlaylistSelect = useCallback((playlist: { tracks: Track[] }) => {
    console.log('BatchGameEditor: Selected playlist with tracks:', playlist.tracks.length);
    onPlaylistChange?.(playlist);
  }, [onPlaylistChange]);

  const handleCreate = useCallback(async () => {
    setIsUpdating(true);
    try {
      // Process each date independently
      for (const date of selectedDates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        try {
          // Set loading state for this date
          onPendingChanges(prev => {
            const newState = { ...prev };
            newState[dateStr] = {
              ...newState[dateStr],
              status: 'loading' as GameStatus
            };
            return newState;
          });

          // Get the song assigned to this date
          const status = pendingChanges[dateStr];
          if (!status?.newSong) {
            throw new Error('No song assigned to date');
          }

          // Process update
          await createOrUpdateGame({
            date: dateStr,
            spotifyId: status.newSong.id
          });

          // Set success state for this date
          onPendingChanges(prev => {
            const newState = { ...prev };
            newState[dateStr] = {
              ...newState[dateStr],
              status: 'success' as GameStatus
            };
            return newState;
          });
        } catch (error) {
          // Set error state for this date only
          onPendingChanges(prev => {
            const newState = { ...prev };
            newState[dateStr] = {
              ...prev[dateStr],
              status: 'error' as GameStatus,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            return newState;
          });
        }
      }
    } finally {
      setIsUpdating(false);
      onComplete();
    }
  }, [selectedDates, pendingChanges, onPendingChanges, onComplete, createOrUpdateGame]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-mono mb-4">Batch Edit</h2>
      
      <PlaylistBrowser onPlaylistSelect={handlePlaylistSelect} />
      
      <div className="mt-4 space-y-4">
        <Button 
          onClick={onReshuffle}
          variant="secondary"
          className="w-full"
        >
          Reshuffle Songs
        </Button>
        
        <Button
          onClick={handleCreate}
          variant="primary"
          className="w-full"
          isLoading={isUpdating}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
} 