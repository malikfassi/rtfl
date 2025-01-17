import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { PlaylistBrowser } from './PlaylistBrowser';
import { useGameMutations } from '@/hooks/use-game-mutations';
import { SpotifyTrack } from '@/types/spotify';
import { GameStatusInfo, AdminGame } from '@/types/admin';

interface BatchGameEditorProps {
  selectedDates: Date[];
  onPendingChanges: (changes: Record<string, GameStatusInfo>) => void;
  onComplete: () => Promise<void>;
  games: AdminGame[];
}

export function BatchGameEditor({ selectedDates, onPendingChanges, onComplete, games }: BatchGameEditorProps) {
  const [songAssignments, setSongAssignments] = useState<Record<string, Date[]>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const { createOrUpdateGame } = useGameMutations();

  // Update pending changes whenever songAssignments changes
  useEffect(() => {
    // Create pending changes with song information
    const changes = selectedDates.reduce((acc, date) => {
      // Find the track assigned to this date
      const spotifyId = Object.entries(songAssignments).find(([_, dates]) => 
        dates.some(d => d.getTime() === date.getTime())
      )?.[0];

      if (spotifyId) {
        const track = tracks.find(t => t.spotifyId === spotifyId);
        if (track) {
          const dateStr = format(date, 'yyyy-MM-dd');
          const existingGame = games?.find(g => g.date === dateStr);
          
          acc[dateStr] = {
            status: existingGame ? 'to-edit' : 'to-create',
            ...(existingGame && {
              currentSong: {
                spotifyId: existingGame.song.spotifyId,
                title: existingGame.song.title,
                artist: existingGame.song.artist
              }
            }),
            newSong: {
              spotifyId: track.spotifyId,
              title: track.title,
              artist: track.artist
            }
          };
        }
      }
      return acc;
    }, {} as Record<string, GameStatusInfo>);

    onPendingChanges(changes);
    
    return () => onPendingChanges({});
  }, [songAssignments, tracks, selectedDates, onPendingChanges, games]);

  const handleSelectPlaylist = async (newTracks: SpotifyTrack[]) => {
    setTracks(newTracks);
    
    // For each date, pick a random song
    const newAssignments: Record<string, Date[]> = {};
    
    selectedDates.forEach(date => {
      const randomTrack = newTracks[Math.floor(Math.random() * newTracks.length)];
      console.log('Assigning track:', randomTrack.spotifyId, 'to date:', date);
      
      if (!newAssignments[randomTrack.spotifyId]) {
        newAssignments[randomTrack.spotifyId] = [];
      }
      newAssignments[randomTrack.spotifyId].push(date);
    });

    setSongAssignments(newAssignments);
  };

  const handleReshuffle = () => {
    // Get all currently assigned tracks
    const assignedTracks = Object.keys(songAssignments);
    if (assignedTracks.length === 0) return;

    // For each date, pick a random song from the currently assigned ones
    const newAssignments: Record<string, Date[]> = {};
    
    selectedDates.forEach(date => {
      const randomTrackId = assignedTracks[Math.floor(Math.random() * assignedTracks.length)];
      if (!newAssignments[randomTrackId]) {
        newAssignments[randomTrackId] = [];
      }
      newAssignments[randomTrackId].push(date);
    });

    setSongAssignments(newAssignments);
  };

  const handleCreate = async () => {
    if (Object.keys(songAssignments).length === 0) return;

    try {
      setIsUpdating(true);
      let currentChanges: Record<string, GameStatusInfo> = {};
      
      // Process dates sequentially to show individual updates
      for (const date of selectedDates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const spotifyId = Object.entries(songAssignments).find(([_, dates]) => 
          dates.some(d => d.getTime() === date.getTime())
        )?.[0];

        if (!spotifyId) continue;

        const track = tracks.find(t => t.spotifyId === spotifyId);
        if (!track) continue;

        const existingGame = games.find(g => g.date === dateStr);

        // Set loading state for this date
        currentChanges = {
          ...currentChanges,
          [dateStr]: {
            status: 'loading',
            ...(existingGame && {
              currentSong: {
                spotifyId: existingGame.song.spotifyId,
                title: existingGame.song.title,
                artist: existingGame.song.artist
              }
            }),
            newSong: {
              spotifyId: track.spotifyId,
              title: track.title,
              artist: track.artist
            }
          }
        };
        onPendingChanges(currentChanges);

        try {
          await createOrUpdateGame({ date: dateStr, spotifyId });
          
          // Update success state
          currentChanges = {
            ...currentChanges,
            [dateStr]: {
              status: 'success',
              ...(existingGame && {
                currentSong: {
                  spotifyId: existingGame.song.spotifyId,
                  title: existingGame.song.title,
                  artist: existingGame.song.artist
                }
              }),
              newSong: {
                spotifyId: track.spotifyId,
                title: track.title,
                artist: track.artist
              }
            }
          };
          onPendingChanges(currentChanges);
        } catch (error) {
          console.error('Failed to update game:', error);
          
          // Update error state
          currentChanges = {
            ...currentChanges,
            [dateStr]: {
              status: 'error',
              ...(existingGame && {
                currentSong: {
                  spotifyId: existingGame.song.spotifyId,
                  title: existingGame.song.title,
                  artist: existingGame.song.artist
                }
              }),
              newSong: {
                spotifyId: track.spotifyId,
                title: track.title,
                artist: track.artist
              },
              error: error instanceof Error ? error.message : 'Failed to update game'
            }
          };
          onPendingChanges(currentChanges);
        }
      }

      // States will persist until user takes action (cancel or select new playlist)

    } catch (error) {
      console.error('Failed to update games:', error);
    } finally {
      setIsUpdating(false);
      await onComplete();
    }
  };

  return (
    <div className="space-y-4">
      <PlaylistBrowser
        onSelect={async (newTracks) => {
          await handleSelectPlaylist(newTracks);
          onPendingChanges({});
        }}
        onCancel={() => {
          setSongAssignments({});
          onPendingChanges({});
        }}
        disabled={isUpdating}
        songAssignments={songAssignments}
      />
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="secondary" 
          onClick={handleReshuffle}
          disabled={Object.keys(songAssignments).length === 0 || isUpdating}
        >
          Reshuffle
        </Button>
        <Button 
          onClick={handleCreate}
          disabled={Object.keys(songAssignments).length === 0 || isUpdating}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
} 