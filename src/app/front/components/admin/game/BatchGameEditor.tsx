import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React, { useCallback, useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import { useAdminGameMutations } from '@/app/front/hooks/useAdmin';
import { GameStatus, GameStatusInfo } from '@/app/types/admin';
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
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ tracks: Track[] } | null>(null);
  const { createGame } = useAdminGameMutations();
  const { toast } = useToast();

  const handlePlaylistSelect = useCallback((playlist: { tracks: Track[] }) => {
    console.log('BatchGameEditor: Selected playlist with tracks:', playlist.tracks.length);
    setSelectedPlaylist(playlist);
    onPlaylistChange?.(playlist);
  }, [onPlaylistChange]);

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
      if (!hasErrors) {
        onComplete();
      }
    }
  }, [selectedDates, pendingChanges, onPendingChanges, onComplete, createGame, toast, selectedPlaylist]);

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
          disabled={isUpdating || !selectedPlaylist}
          isLoading={isUpdating}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
} 