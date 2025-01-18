import React, { useState, useCallback } from 'react';
import { Calendar } from './Calendar';
import { GameEditor } from './GameEditor';
import { BatchGameEditor } from './BatchGameEditor';
import { isSameDay, format } from 'date-fns';
import { useGames } from '@/hooks/useGames';
import type { AdminGame, GameStatusInfo } from '@/types/admin';
import type { Track } from '@spotify/web-api-ts-sdk';

interface AdminDashboardProps {
  onGameUpdate: () => Promise<void>;
  selectedPlaylist?: { 
    tracks: Track[];
  };
  onPlaylistChange?: (playlist: AdminDashboardProps['selectedPlaylist']) => void;
}

type EditorMode = 'preview' | 'search';

export function AdminDashboard({ onGameUpdate, selectedPlaylist, onPlaylistChange }: AdminDashboardProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pendingChanges, setPendingChanges] = useState<Record<string, GameStatusInfo>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>('preview');
  const { games, setGames } = useGames(currentMonth);

  const assignRandomSongToDate = useCallback((date: Date) => {
    const tracks = selectedPlaylist?.tracks ?? [];
    if (tracks.length === 0) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const existingGame = games.find((g: AdminGame) => 
      isSameDay(new Date(g.date), date)
    );
    
    const randomSong = tracks[Math.floor(Math.random() * tracks.length)];

    setPendingChanges(prev => ({
      ...prev,
      [dateKey]: {
        status: existingGame ? 'to-edit' : 'to-create',
        ...(existingGame && { currentSong: existingGame.song }),
        newSong: randomSong
      }
    }));
  }, [selectedPlaylist, games, setPendingChanges]);

  const handleDateSelect = useCallback((dates: Date[]) => {
    console.log('\n=== Date Selection Update ===');
    console.log('Current selected dates:', selectedDates.map(d => format(d, 'yyyy-MM-dd')));
    console.log('New dates:', dates.map(d => format(d, 'yyyy-MM-dd')));
    console.log('Has playlist:', !!selectedPlaylist);
    console.log('Playlist tracks:', selectedPlaylist?.tracks?.length ?? 0);

    // Check if we're switching modes
    const wasBatchMode = selectedDates.length > 1;
    const willBeBatchMode = dates.length > 1;
    const isModeSwitching = wasBatchMode !== willBeBatchMode;

    // Get previously selected dates that are no longer selected
    const removedDates = selectedDates.filter(
      oldDate => !dates.some(newDate => isSameDay(oldDate, newDate))
    );

    // Get newly selected dates
    const newlySelectedDates = dates.filter(
      newDate => !selectedDates.some(oldDate => isSameDay(oldDate, newDate))
    );

    console.log('Removed dates:', removedDates.map(d => format(d, 'yyyy-MM-dd')));
    console.log('Newly selected dates:', newlySelectedDates.map(d => format(d, 'yyyy-MM-dd')));

    // Update selection first
    setSelectedDates(dates);

    // Handle removed dates - only clear pending changes
    removedDates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[dateKey];
        return newChanges;
      });
    });

    // Reset playlist and pending changes if switching modes
    if (isModeSwitching) {
      console.log('Switching modes, resetting playlist and pending changes');
      onPlaylistChange?.(undefined);
      setPendingChanges({});
    }

    // Only assign songs to newly selected dates if we're not removing dates
    const tracks = selectedPlaylist?.tracks ?? [];
    if (tracks.length > 0 && newlySelectedDates.length > 0 && removedDates.length === 0) {
      console.log('Assigning songs to new dates from playlist with', tracks.length, 'tracks');
      
      newlySelectedDates.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const existingGame = games.find((g: AdminGame) => 
          isSameDay(new Date(g.date), date)
        );
        
        const randomSong = tracks[Math.floor(Math.random() * tracks.length)];
        console.log(`Assigning "${randomSong.name}" to ${dateKey}`);

        setPendingChanges(prev => {
          const newChanges = { ...prev };
          newChanges[dateKey] = {
            status: existingGame ? 'to-edit' : 'to-create',
            ...(existingGame && { currentSong: existingGame.song }),
            newSong: randomSong
          };
          return newChanges;
        });
      });
    } else {
      console.log('No songs assigned:', 
        tracks.length === 0 ? 'No tracks available' : 
        removedDates.length > 0 ? 'Removing dates' : 
        'No new dates'
      );
    }

    // Reset editor mode when switching to single selection
    if (dates.length <= 1) {
      setEditorMode('preview');
    }
  }, [selectedDates, selectedPlaylist, games, setPendingChanges, setSelectedDates, setEditorMode, onPlaylistChange]);

  const handleGameUpdate = useCallback(async (newGame?: AdminGame) => {
    if (selectedDates.length === 0) return;

    const dateKey = format(selectedDates[0], 'yyyy-MM-dd');
    try {
      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: { ...prev[dateKey], status: 'loading' }
      }));

      if (newGame) {
        // Update games list immediately with the new game
        setGames((prev: AdminGame[]) => {
          const filtered = prev.filter((g: AdminGame) => !isSameDay(new Date(g.date), selectedDates[0]));
          return [...filtered, newGame];
        });
      } else {
        // If no new game data provided, fetch updates from server
        await onGameUpdate();
      }

      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: { ...prev[dateKey], status: 'success' }
      }));

      setEditorMode('preview');
    } catch (error) {
      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to update game'
        }
      }));
    }
  }, [onGameUpdate, selectedDates, setGames]);

  const handlePlaylistChange = useCallback((playlist: AdminDashboardProps['selectedPlaylist']) => {
    if (!playlist?.tracks.length) return;
    
    console.log('\n=== Playlist Change ===');
    console.log('Selected dates:', selectedDates.map(d => format(d, 'yyyy-MM-dd')));
    console.log('New playlist tracks:', playlist.tracks.length);
    
    // Re-assign random songs to all selected dates
    selectedDates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingGame = games.find((g: AdminGame) => 
        isSameDay(new Date(g.date), date)
      );
      
      const randomSong = playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
      console.log(`Assigning "${randomSong.name}" to ${dateKey}`);

      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: {
          status: existingGame ? 'to-edit' : 'to-create',
          ...(existingGame && { currentSong: existingGame.song }),
          newSong: randomSong
        }
      }));
    });

    onPlaylistChange?.(playlist);
  }, [selectedDates, games, setPendingChanges, onPlaylistChange]);

  return (
    <div className="h-full grid grid-cols-[1fr,400px] gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-mono mb-4">Game Editor</h1>

        <Calendar
          selectedDates={selectedDates}
          onSelect={handleDateSelect}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          games={games}
          pendingChanges={pendingChanges}
        />
      </div>

      <div className="flex flex-col">
        {selectedDates.length <= 1 ? (
          <GameEditor
            selectedDate={selectedDates[0]}
            game={games.find((g: AdminGame) => selectedDates[0] && isSameDay(new Date(g.date), selectedDates[0]))}
            onGameUpdate={handleGameUpdate}
            mode={editorMode}
            onModeChange={setEditorMode}
          />
        ) : (
          <BatchGameEditor
            selectedDates={selectedDates}
            games={games}
            pendingChanges={pendingChanges}
            onPendingChanges={setPendingChanges}
            onComplete={() => {
              setSelectedDates([]);
              setPendingChanges({});
            }}
            onPlaylistChange={handlePlaylistChange}
            onReshuffle={() => selectedDates.forEach(assignRandomSongToDate)}
          />
        )}
      </div>
    </div>
  );
} 