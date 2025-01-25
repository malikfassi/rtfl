import type { Track } from '@spotify/web-api-ts-sdk';
import { format, isSameDay } from 'date-fns';
import React, { useCallback, useState, useEffect } from 'react';

import { getTrackArtist, getTrackTitle } from '@/app/front/lib/utils/spotify';
import type { GameWithSong } from '@/app/api/lib/services/game';
import type { GameStatusInfo, AdminGame } from '@/app/types/admin';

import { BatchGameEditor } from './BatchGameEditor';
import { Calendar } from './Calendar';
import { type EditorMode as GameEditorMode, GameEditor } from './GameEditor';

interface Game {
  id: string;
  date: string;
  song: {
    id: string;
    title: string;
    artist: string;
  };
}

interface AdminDashboardProps {
  games: GameWithSong[];
  onCreateGame: (input: { date: string; spotifyId: string }) => void;
  onDeleteGame: (date: string) => void;
  selectedPlaylist?: { tracks: Track[] };
  onPlaylistChange: (playlist: { tracks: Track[] }) => void;
}

type EditorMode = 'single' | 'batch';

export function AdminDashboard({ 
  games,
  onCreateGame,
  onDeleteGame,
  selectedPlaylist, 
  onPlaylistChange 
}: AdminDashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, GameStatusInfo>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>('single');
  const [gameEditorMode, setGameEditorMode] = useState<GameEditorMode>('preview');

  // Automatically switch modes based on number of selected dates
  useEffect(() => {
    setEditorMode(selectedDates.length > 1 ? 'batch' : 'single');
  }, [selectedDates.length]);

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
        const { [newGame.date]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  }, [onCreateGame]);

  const handleGameDelete = useCallback(async (date: string) => {
    try {
      await onDeleteGame(date);
      setPendingChanges(prev => {
        const { [date]: _, ...rest } = prev;
        return rest;
      });
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <Calendar
          selectedDates={selectedDates}
          onSelect={setSelectedDates}
          games={transformedGames}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          pendingChanges={pendingChanges}
        />
      </div>

      <div>
        {editorMode === 'single' ? (
          <GameEditor
            mode={gameEditorMode}
            onModeChange={setGameEditorMode}
            selectedDate={selectedDates[0]}
            game={games.find(g => selectedDates[0] && isSameDay(new Date(g.date), selectedDates[0])) as AdminGame}
            onGameUpdate={handleGameUpdate}
            onGameDelete={handleGameDelete}
            onRandomSongAssign={assignRandomSongToDate}
            selectedPlaylist={selectedPlaylist}
            onPlaylistChange={onPlaylistChange}
            pendingChange={selectedDates[0] ? pendingChanges[format(selectedDates[0], 'yyyy-MM-dd')] : undefined}
          />
        ) : (
          <BatchGameEditor
            selectedDates={selectedDates}
            games={transformedGames}
            pendingChanges={pendingChanges}
            onPendingChanges={setPendingChanges}
            onComplete={() => {
              setEditorMode('single');
              setSelectedDates([]);
              setPendingChanges({});
            }}
            onPlaylistChange={onPlaylistChange}
            onReshuffle={() => selectedDates.forEach(assignRandomSongToDate)}
          />
        )}
      </div>
    </div>
  );
} 