import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { useGameMutations } from '@/hooks/use-game-mutations';
import { SpotifyTrack } from '@/lib/clients/spotify';
import { PlaylistBrowser } from './PlaylistBrowser';

interface BatchGameEditorProps {
  selectedDates: Date[];
  onGameUpdate: () => Promise<void>;
}

export function BatchGameEditor({ selectedDates, onGameUpdate }: BatchGameEditorProps) {
  const [songAssignments, setSongAssignments] = useState<Record<string, Date[]>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { createOrUpdateGame } = useGameMutations();

  const handleSelectPlaylist = async (tracks: SpotifyTrack[]) => {
    const newAssignments: Record<string, Date[]> = {};
    
    console.log('Selected dates:', selectedDates);
    console.log('Available tracks:', tracks);
    console.log('First track example:', tracks[0]);
    
    // For each date, pick a random song
    selectedDates.forEach(date => {
      // Pick a random song
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      console.log('Assigning date', format(date, 'MM.dd'), 'to track:', randomTrack.title, 'with ID:', randomTrack.spotifyId);
      
      // Initialize array for this track if needed
      if (!newAssignments[randomTrack.spotifyId]) {
        newAssignments[randomTrack.spotifyId] = [];
      }
      
      // Add this date to the track's assignments
      newAssignments[randomTrack.spotifyId].push(date);
    });
    
    console.log('Final assignments:', JSON.stringify(newAssignments, null, 2));
    setSongAssignments(newAssignments);
  };

  const handleReshuffle = () => {
    const newAssignments: Record<string, Date[]> = {};
    const trackIds = Object.keys(songAssignments);
    
    console.log('Reshuffling dates:', selectedDates);
    console.log('Available track IDs:', trackIds);
    
    // For each date, pick a random song from current tracks
    selectedDates.forEach(date => {
      const randomTrackId = trackIds[Math.floor(Math.random() * trackIds.length)];
      console.log('Assigning date', format(date, 'MM.dd'), 'to track ID:', randomTrackId);
      
      if (!newAssignments[randomTrackId]) {
        newAssignments[randomTrackId] = [];
      }
      newAssignments[randomTrackId].push(date);
    });
    
    console.log('Final assignments after reshuffle:', JSON.stringify(newAssignments, null, 2));
    setSongAssignments(newAssignments);
  };

  const handleCreate = async () => {
    if (Object.keys(songAssignments).length === 0) return;

    try {
      setIsUpdating(true);
      
      // Create or update games for all assignments
      await Promise.all(
        Object.entries(songAssignments).flatMap(([id, dates]) => 
          dates.map(date => 
            createOrUpdateGame({ 
              date: format(date, 'yyyy-MM-dd'), 
              spotifyId: id 
            })
          )
        )
      );

      await onGameUpdate();
      setSongAssignments({});
    } catch (error) {
      console.error('Failed to update games:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <PlaylistBrowser
        songAssignments={songAssignments}
        onSelect={handleSelectPlaylist}
        onCancel={() => setSongAssignments({})}
        disabled={isUpdating}
      />
      
      {Object.keys(songAssignments).length > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={handleReshuffle}
            disabled={isUpdating}
          >
            Reshuffle
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isUpdating}
          >
            Apply Changes
          </Button>
        </div>
      )}
    </div>
  );
} 