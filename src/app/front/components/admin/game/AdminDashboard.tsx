import type { Track } from '@spotify/web-api-ts-sdk';
import { format, isSameDay } from 'date-fns';
import React, { useCallback,useState,useEffect } from 'react';

import { useGames } from '@/app/front/hooks/useGames';
import { getTrackArtist,getTrackTitle } from '@/app/front/lib/utils/spotify';
import type { AdminGame, GameStatusInfo } from '@/app/types/admin';

import { BatchGameEditor } from './BatchGameEditor';
import { Calendar } from './Calendar';
import { type EditorMode as GameEditorMode,GameEditor } from './GameEditor';

interface AdminDashboardProps {
  onGameUpdate: (game?: AdminGame) => Promise<void>;
  selectedPlaylist?: { tracks: Track[] };
  onPlaylistChange: (playlist: { tracks: Track[] }) => void;
}

type EditorMode = 'single' | 'batch';

export function AdminDashboard({ onGameUpdate, selectedPlaylist, onPlaylistChange }: AdminDashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, GameStatusInfo>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>('single');
  const [gameEditorMode, setGameEditorMode] = useState<GameEditorMode>('preview');

  const { data: games = [], isLoading } = useGames(currentMonth);

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

  const handleDateSelect = useCallback((dates: Date[]) => {
    // Update selected dates
    setSelectedDates(dates);

    // Clear any pending changes for dates that are no longer selected
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      Object.keys(newChanges).forEach(dateStr => {
        if (!dates.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
          delete newChanges[dateStr];
        }
      });
      return newChanges;
    });
  }, []);

  const handlePlaylistChange = useCallback((playlist: { tracks: Track[] }) => {
    console.log('AdminDashboard: Selected playlist with tracks:', playlist.tracks.length);
    onPlaylistChange?.(playlist);

    // Assign random songs to all selected dates
    selectedDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const game = games.find(g => format(new Date(g.date), 'yyyy-MM-dd') === dateStr);
      const randomTrack = playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];

      setPendingChanges(prev => ({
        ...prev,
        [dateStr]: {
          status: game ? 'to-edit' : 'to-create',
          newSong: randomTrack,
          currentSong: game?.song.spotifyData as Track | undefined
        }
      }));
    });
  }, [selectedDates, games, onPlaylistChange]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-[1fr,400px] gap-4">
      <div className="space-y-4">
        <Calendar
          selectedDates={selectedDates}
          onSelect={handleDateSelect}
          games={games}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          pendingChanges={pendingChanges}
        />
      </div>

      {editorMode === 'single' && selectedDates.length === 1 && (
        <GameEditor
          selectedDate={selectedDates[0]}
          game={games.find(g => isSameDay(new Date(g.date), selectedDates[0]))}
          onGameUpdate={onGameUpdate}
          mode={gameEditorMode}
          onModeChange={setGameEditorMode}
        />
      )}

      {editorMode === 'batch' && selectedDates.length > 1 && (
        <BatchGameEditor
          selectedDates={selectedDates}
          games={games.map(game => ({
            date: format(new Date(game.date), 'yyyy-MM-dd'),
            song: {
              id: game.song.spotifyId,
              title: getTrackTitle(game.song.spotifyData as unknown as Track),
              artist: getTrackArtist(game.song.spotifyData as unknown as Track)
            }
          }))}
          pendingChanges={pendingChanges}
          onPendingChanges={setPendingChanges}
          onComplete={() => {
            setEditorMode('single');
            setSelectedDates([]);
            setPendingChanges({});
          }}
          onPlaylistChange={handlePlaylistChange}
          onReshuffle={() => selectedDates.forEach(assignRandomSongToDate)}
        />
      )}
    </div>
  );
} 