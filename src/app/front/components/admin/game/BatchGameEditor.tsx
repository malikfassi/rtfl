import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React, { useCallback, useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import { useAdminGameMutations } from '@/app/front/hooks/useAdmin';
import { GameStatus, GameStatusInfo } from '@/app/types/admin';

import { PlaylistBrowser } from './PlaylistBrowser';

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
  const { createGame } = useAdminGameMutations();

  const handlePlaylistSelect = useCallback((playlist: { tracks: Track[] }) => {
    console.log('BatchGameEditor: Selected playlist with tracks:', playlist.tracks.length);
    onPlaylistChange?.(playlist);
  }, [onPlaylistChange]);

  const handleCreate = useCallback(async () => {
    setIsUpdating(true);
    let hasErrors = false;

    try {
      // Process each date independently
      await Promise.all(selectedDates.map(async (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        try {
          // Set loading state for this date
          onPendingChanges(prev => ({
            ...prev,
            [dateStr]: {
              ...prev[dateStr],
              status: 'loading' as GameStatus
            }
          }));

          // Get the song assigned to this date
          const status = pendingChanges[dateStr];
          if (!status?.newSong) {
            throw new Error('No song assigned to date');
          }

          // Process update
          await createGame.mutateAsync({
            date: dateStr,
            spotifyId: status.newSong.id
          });

          // Set success state for this date
          onPendingChanges(prev => ({
            ...prev,
            [dateStr]: {
              ...prev[dateStr],
              status: 'success' as GameStatus
            }
          }));
        } catch (error) {
          hasErrors = true;
          // Set error state for this date only
          onPendingChanges(prev => ({
            ...prev,
            [dateStr]: {
              ...prev[dateStr],
              status: 'error' as GameStatus,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }));
        }
      }));
    } finally {
      setIsUpdating(false);
      if (!hasErrors) {
        onComplete();
      }
    }
  }, [selectedDates, pendingChanges, onPendingChanges, onComplete, createGame]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-mono mb-4">Batch Edit</h2>
      
      <PlaylistBrowser onPlaylistSelect={handlePlaylistSelect} />
      
      <div className="mt-4 space-y-4">
        <Button 
          onClick={onReshuffle}
          variant="secondary"
          className="w-full"
          disabled={isUpdating}
        >
          Reshuffle Songs
        </Button>
        
        <Button
          onClick={handleCreate}
          variant="primary"
          className="w-full"
          disabled={isUpdating}
          isLoading={isUpdating}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
} 