import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React, { useCallback, useState, useEffect, useRef } from 'react';

import { getTrackArtist, getTrackTitle } from '@/app/front/lib/helpers/spotify';
import type { GameWithSong } from '@/app/api/lib/services/game';
import type { GameStatusInfo, AdminGame } from '@/app/types';
import type { CustomPlaylist } from '@/app/types';

import { BatchGameEditor } from './BatchGameEditor';
import { Calendar } from './Calendar';
import { GameEditor } from './GameEditor';
import { useAdminGamesWithSurroundingMonths } from '@/app/front/hooks/useAdmin';

interface AdminDashboardProps {
  games: GameWithSong[];
  onCreateGame: (input: { date: string; spotifyId: string }) => void;
  onDeleteGame: (date: string) => void;
  selectedPlaylist?: CustomPlaylist;
  onPlaylistChange: (playlist: CustomPlaylist | undefined) => void;
}

type EditorMode = 'preview' | 'search';

export function AdminDashboard({ 
  onCreateGame,
  onDeleteGame,
  selectedPlaylist, 
  onPlaylistChange 
}: AdminDashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: games = [] } = useAdminGamesWithSurroundingMonths(currentMonth);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, GameStatusInfo>>({});
  const [singleViewMode, setSingleViewMode] = useState<EditorMode>('preview');
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key and click outside to unselect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedDates([]);
        setPendingChanges({});
        setSingleViewMode('preview');
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Check if click was on calendar area specifically
        const calendarContainer = containerRef.current.querySelector('[data-calendar]');
        if (calendarContainer && !calendarContainer.contains(event.target as Node)) {
          setSelectedDates([]);
          setPendingChanges({});
          setSingleViewMode('preview');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClearPendingChanges = useCallback((dates: Date[]) => {
    const dateStrs = dates.map(date => format(date, 'yyyy-MM-dd'));
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      dateStrs.forEach(dateStr => {
        delete newChanges[dateStr];
      });
      return newChanges;
    });
  }, []);

  // Auto-assign songs when playlist is selected and dates are chosen
  useEffect(() => {
    if (selectedPlaylist?.tracks.length && selectedDates.length > 1) {
      setPendingChanges(prev => {
        const selectedDateStrs = new Set(selectedDates.map(date => format(date, 'yyyy-MM-dd')));
        const filteredChanges: Record<string, GameStatusInfo> = {};
        Object.entries(prev).forEach(([dateStr, change]) => {
          if (selectedDateStrs.has(dateStr)) {
            filteredChanges[dateStr] = change;
          }
        });
        const datesToAssign = selectedDates.filter(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          return !filteredChanges[dateStr];
        });
        if (datesToAssign.length === 0) return filteredChanges;
        const newChanges: Record<string, GameStatusInfo> = {};
        datesToAssign.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const game = games.find(g => format(new Date(g.date), 'yyyy-MM-dd') === dateStr);
          const randomTrack = selectedPlaylist.tracks[Math.floor(Math.random() * selectedPlaylist.tracks.length)];
          newChanges[dateStr] = {
            status: game ? 'to-edit' : 'to-create',
            newSong: randomTrack,
            currentSong: game?.song.spotifyData as Track | undefined
          };
        });
        return { ...filteredChanges, ...newChanges };
      });
    } else if (selectedDates.length <= 1) {
      // Only clear if not already empty
      setPendingChanges(prev => {
        if (Object.keys(prev).length === 0) return prev;
        return {};
      });
    }
  }, [selectedPlaylist, selectedDates, games]);

  const assignRandomSongToDate = useCallback((date: Date) => {
    if (!selectedPlaylist?.tracks.length) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const game = games.find(g => format(new Date(g.date), 'yyyy-MM-dd') === dateStr);
    const randomTrack = selectedPlaylist.tracks[Math.floor(Math.random() * selectedPlaylist.tracks.length)];

    setPendingChanges(prev => ({
      ...prev,
      [dateStr]: {
        status: game ? 'to-edit' : 'to-create',
        newSong: randomTrack,
        currentSong: game?.song.spotifyData as Track | undefined
      }
    }));
  }, [selectedPlaylist, games]);

  const handleGameUpdate = useCallback(async (newGame?: AdminGame) => {
    if (!newGame) return;
    try {
      await onCreateGame({ 
        date: newGame.date,
        spotifyId: newGame.song.spotifyId
      });
      setPendingChanges(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [newGame.date]: _unused, ...rest } = prev;
        return rest;
      });
      setSingleViewMode('preview');
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  }, [onCreateGame]);

  const handleGameDelete = useCallback(async (date: string) => {
    try {
      await onDeleteGame(date);
      setPendingChanges(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [date]: _unused, ...rest } = prev;
        return rest;
      });
      setSingleViewMode('preview');
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  }, [onDeleteGame]);

  const transformedGames = games.map(game => ({
    id: game.id,
    date: game.date,
    song: {
      id: game.song.spotifyId,
      title: getTrackTitle(game.song.spotifyData as unknown as Track),
      artist: getTrackArtist(game.song.spotifyData as unknown as Track)
    }
  }));

  // Determine editor mode based on selection
  const editorMode = selectedDates.length > 1 ? 'batch' : 'single';

  // Get the currently selected game for single mode
  const selectedGame = selectedDates[0]
    ? games.find(g => g.date === format(selectedDates[0], 'yyyy-MM-dd'))
    : undefined;

  const handleSelectDates = (dates: Date[]) => {
    setSelectedDates(dates);
    setPendingChanges({});
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div data-calendar>
        <Calendar
          selectedDates={selectedDates}
          onSelect={handleSelectDates}
          games={transformedGames}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          pendingChanges={pendingChanges}
          onClearPendingChanges={handleClearPendingChanges}
        />
      </div>

      <div>
        {editorMode === 'single' ? (
          selectedDates.length === 1 ? (
            <GameEditor
              mode={singleViewMode}
              onModeChange={setSingleViewMode}
              selectedDate={selectedDates[0]}
              game={selectedGame as AdminGame || null}
              onGameUpdate={handleGameUpdate}
              onGameDelete={handleGameDelete}
              onRandomSongAssign={assignRandomSongToDate}
              selectedPlaylist={selectedPlaylist}
              pendingChange={pendingChanges[format(selectedDates[0], 'yyyy-MM-dd')]}
            />
          ) : (
            <div className="p-4 text-center text-muted">
              Select a date to view or edit
            </div>
          )
        ) : (
          <BatchGameEditor
            selectedDates={selectedDates}
            games={transformedGames}
            pendingChanges={pendingChanges}
            onPendingChanges={setPendingChanges}
            onComplete={() => {
              setSelectedDates([]);
              setPendingChanges({});
              setSingleViewMode('preview');
            }}
            onPlaylistChange={onPlaylistChange}
            onReshuffle={() => selectedDates.forEach(assignRandomSongToDate)}
          />
        )}
      </div>
    </div>
  );
} 