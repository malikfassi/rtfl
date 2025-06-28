import type { CustomPlaylist } from '@/app/types';
import { format, addMonths } from 'date-fns';
import React, { useCallback, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/app/front/components/ui/Button';
import { useAdminGameMutations } from '@/app/front/hooks/useAdmin';
import { GameStatus, GameStatusInfo } from '@/app/types';
import { useToast } from '@/app/front/hooks/use-toast';

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
  onPlaylistChange?: (playlist: CustomPlaylist) => void;
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
  const [selectedPlaylist, setSelectedPlaylist] = useState<CustomPlaylist | null>(null);
  const { createGame } = useAdminGameMutations();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePlaylistSelect = useCallback((playlist: CustomPlaylist) => {
    console.log('BatchGameEditor: Selected playlist with tracks:', playlist.tracks.length);
    setSelectedPlaylist(playlist);
    onPlaylistChange?.(playlist);
  }, [onPlaylistChange]);

  // Calculate song assignments based on pending changes
  const songAssignments = useMemo(() => {
    const assignments: Record<string, string[]> = {};
    
    Object.entries(pendingChanges).forEach(([date, change]) => {
      if (change.newSong?.id) {
        const songId = change.newSong.id;
        if (!assignments[songId]) {
          assignments[songId] = [];
        }
        assignments[songId].push(date);
      }
    });
    
    return assignments;
  }, [pendingChanges]);

  const handleCreate = useCallback(async () => {
    if (!selectedPlaylist?.tracks.length) {
      toast({
        title: "Error",
        description: "Please select a playlist first",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    let hasErrors = false;
    let hasSuccess = false;

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

          // Get the song assigned to this date or pick a random one
          const status = pendingChanges[dateStr];
          let songToUse = status?.newSong;

          if (!songToUse) {
            // Pick a random song from the playlist
            const randomIndex = Math.floor(Math.random() * selectedPlaylist.tracks.length);
            songToUse = selectedPlaylist.tracks[randomIndex];
          }

          if (!songToUse) {
            throw new Error('No song available to assign');
          }

          // Process update
          await createGame.mutateAsync({
            date: dateStr,
            spotifyId: songToUse.id
          });

          // Set success state for this date
          onPendingChanges(prev => ({
            ...prev,
            [dateStr]: {
              ...prev[dateStr],
              status: 'success' as GameStatus,
              newSong: songToUse
            }
          }));

          toast({
            title: "Success",
            description: `Game created for ${dateStr}`,
          });
          hasSuccess = true;
        } catch (error) {
          hasErrors = true;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Set error state for this date only
          onPendingChanges(prev => ({
            ...prev,
            [dateStr]: {
              ...prev[dateStr],
              status: 'error' as GameStatus,
              error: errorMessage
            }
          }));

          toast({
            title: "Error",
            description: `Failed to create game for ${dateStr}: ${errorMessage}`,
            variant: "destructive",
          });
        }
      }));
    } finally {
      setIsUpdating(false);
      if (hasSuccess) {
        // Invalidate queries for current, previous, and next months
        const months = [0, -1, 1].map(offset => format(addMonths(selectedDates[0], offset), 'yyyy-MM'));
        months.forEach(month => {
          queryClient.invalidateQueries({ queryKey: ['games', 'surrounding', month] });
        });
      }
      if (!hasErrors) {
        onComplete();
      }
    }
  }, [selectedDates, pendingChanges, onPendingChanges, onComplete, createGame, toast, selectedPlaylist, queryClient]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-mono mb-4">Batch Edit</h2>
      
      <PlaylistBrowser 
        onPlaylistSelect={handlePlaylistSelect} 
        onReshuffle={onReshuffle}
        songAssignments={songAssignments}
      />
      
      <div className="mt-4">
        <Button
          onClick={handleCreate}
          variant="primary"
          className="w-full"
          disabled={isUpdating || !selectedPlaylist}
          isLoading={isUpdating}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
} 