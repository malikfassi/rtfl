import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { SpotifyTrack } from '@/types/spotify';
import { GameStatus, GameStatusInfo } from '@/types/admin';
import { Button } from '@/components/ui/Button';
import { PlaylistBrowser } from './PlaylistBrowser';
import { useGameMutations } from '@/hooks/use-game-mutations';

interface BatchGameEditorProps {
  selectedDates: Date[];
  games: Array<{
    date: string;
    song: SpotifyTrack;
  }>;
  onPendingChanges: (changes: Record<string, GameStatusInfo>) => void;
  onComplete: () => void;
}

interface TrackAssignment {
  track: SpotifyTrack;
  dates: Date[];
}

export function BatchGameEditor({ 
  selectedDates, 
  games,
  onPendingChanges,
  onComplete 
}: BatchGameEditorProps) {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [trackAssignments, setTrackAssignments] = useState<Record<string, TrackAssignment>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { createOrUpdateGame } = useGameMutations();

  const assignRandomTracks = useCallback((availableTracks: SpotifyTrack[]) => {
    // Create a map of track assignments
    const newAssignments: Record<string, TrackAssignment> = {};
    
    console.log('BatchGameEditor: Assigning tracks to dates:', 
      selectedDates.map(d => format(d, 'yyyy-MM-dd')));
    
    // Assign a random track to each date
    selectedDates.forEach(date => {
      const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
      const trackId = randomTrack.spotifyId;
      
      console.log('BatchGameEditor: Assigning track', randomTrack.title, 'to date', format(date, 'yyyy-MM-dd'));
      
      if (newAssignments[trackId]) {
        newAssignments[trackId].dates.push(date);
      } else {
        newAssignments[trackId] = {
          track: randomTrack,
          dates: [date]
        };
      }
    });

    return newAssignments;
  }, [selectedDates]);

  const handleSelectPlaylist = useCallback(async (newTracks: SpotifyTrack[]) => {
    console.log('BatchGameEditor: Selected dates for playlist:', 
      selectedDates.map(d => format(d, 'yyyy-MM-dd')));
    
    setTracks(newTracks);
    
    // Create initial assignments with random tracks
    const newAssignments = assignRandomTracks(newTracks);
    setTrackAssignments(newAssignments);

    // Set initial pending states
    const pendingChanges = selectedDates.reduce((acc, date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingGame = games.find(game => format(new Date(game.date), 'yyyy-MM-dd') === dateStr);
      
      // Find which track was assigned to this date
      const assignedTrack = Object.values(newAssignments).find(
        assignment => assignment.dates.some(d => format(d, 'yyyy-MM-dd') === dateStr)
      )?.track;
      
      if (!assignedTrack) {
        console.warn('BatchGameEditor: No track assigned for date:', dateStr);
        return acc;
      }
      
      console.log('BatchGameEditor: Setting pending change for date:', dateStr, 
        'track:', assignedTrack.title);
      
      acc[dateStr] = {
        status: existingGame ? 'to-edit' : 'to-create' as GameStatus,
        currentSong: existingGame?.song,
        newSong: assignedTrack
      };
      return acc;
    }, {} as Record<string, GameStatusInfo>);
    
    onPendingChanges(pendingChanges);
  }, [selectedDates, games, onPendingChanges, assignRandomTracks]);

  const handleReshuffle = useCallback(() => {
    if (!tracks.length) return;

    console.log('BatchGameEditor: Reshuffling tracks for dates:', 
      selectedDates.map(d => format(d, 'yyyy-MM-dd')));

    // Create new random assignments
    const newAssignments = assignRandomTracks(tracks);
    setTrackAssignments(newAssignments);

    // Update pending changes
    const pendingChanges = selectedDates.reduce((acc, date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingGame = games.find(game => format(new Date(game.date), 'yyyy-MM-dd') === dateStr);
      
      // Find which track was assigned to this date
      const assignedTrack = Object.values(newAssignments).find(
        assignment => assignment.dates.some(d => format(d, 'yyyy-MM-dd') === dateStr)
      )?.track;
      
      if (!assignedTrack) {
        console.warn('BatchGameEditor: No track assigned for date after reshuffle:', dateStr);
        return acc;
      }
      
      console.log('BatchGameEditor: Setting pending change after reshuffle for date:', dateStr, 
        'track:', assignedTrack.title);
      
      acc[dateStr] = {
        status: existingGame ? 'to-edit' : 'to-create' as GameStatus,
        currentSong: existingGame?.song,
        newSong: assignedTrack
      };
      return acc;
    }, {} as Record<string, GameStatusInfo>);
    
    onPendingChanges(pendingChanges);
  }, [tracks, selectedDates, games, onPendingChanges, assignRandomTracks]);

  const handleCreate = useCallback(async () => {
    setIsUpdating(true);
    try {
      // Process each date independently
      for (const assignment of Object.values(trackAssignments)) {
        const { track, dates } = assignment;
        
        for (const date of dates) {
          const dateStr = format(date, 'yyyy-MM-dd');
          
          try {
            // Set loading state for this date
            onPendingChanges((prev: Record<string, GameStatusInfo>) => {
              const newState = { ...prev };
              newState[dateStr] = {
                ...newState[dateStr],
                status: 'loading' as GameStatus
              };
              return newState;
            });

            // Process update
            await createOrUpdateGame({
              date: dateStr,
              spotifyId: track.spotifyId
            });

            // Set success state for this date
            onPendingChanges((prev: Record<string, GameStatusInfo>) => {
              const newState = { ...prev };
              newState[dateStr] = {
                ...newState[dateStr],
                status: 'success' as GameStatus
              };
              return newState;
            });
          } catch (error) {
            // Set error state for this date only
            onPendingChanges((prev: Record<string, GameStatusInfo>) => {
              const newState = { ...prev };
              newState[dateStr] = {
                ...newState[dateStr],
                status: 'error' as GameStatus,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
              return newState;
            });
          }
        }
      }
    } finally {
      setIsUpdating(false);
      onComplete();
    }
  }, [games, trackAssignments, onPendingChanges, onComplete, createOrUpdateGame]);

  // Convert trackAssignments to format expected by PlaylistBrowser
  const songAssignments = Object.values(trackAssignments).reduce((acc, { track, dates }) => {
    acc[track.spotifyId] = dates;
    return acc;
  }, {} as Record<string, Date[]>);

  return (
    <div className="space-y-8">
      <PlaylistBrowser
        onSelect={handleSelectPlaylist}
        onCancel={() => {
          setTrackAssignments({});
          onPendingChanges({});
        }}
        disabled={isUpdating}
        songAssignments={songAssignments}
      />

      {tracks.length > 0 && (
        <div className="space-y-4">
          <Button
            variant="secondary"
            onClick={handleReshuffle}
            disabled={isUpdating}
          >
            Reshuffle
          </Button>

          <Button
            onClick={handleCreate}
            disabled={isUpdating || Object.keys(trackAssignments).length === 0}
          >
            {isUpdating ? 'Updating...' : 'Update Games'}
          </Button>
        </div>
      )}
    </div>
  );
} 