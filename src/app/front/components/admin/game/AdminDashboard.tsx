import type { Track } from '@spotify/web-api-ts-sdk';
import { format, isSameDay } from 'date-fns';
import React, { useCallback, useState } from 'react';

import { getTrackArtist, getTrackTitle } from '@/app/front/lib/utils/spotify';
import type { GameWithSong } from '@/app/api/lib/services/game';
import type { GameStatusInfo, AdminGame } from '@/app/types/admin';
import { LyricsGame } from '@/app/front/components/game/LyricsGame';
import { Button } from '@/app/front/components/ui/Button';

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
type SingleViewMode = 'preview' | 'edit';

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
  const [singleViewMode, setSingleViewMode] = useState<SingleViewMode>('preview');

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
      setSingleViewMode('preview');
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
  const selectedGame = selectedDates[0] ? games.find(g => isSameDay(new Date(g.date), selectedDates[0])) : undefined;

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
          selectedDates.length === 1 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {format(selectedDates[0], 'MMMM d, yyyy')}
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setSingleViewMode(singleViewMode === 'preview' ? 'edit' : 'preview')}
                >
                  {singleViewMode === 'preview' ? 'Edit' : 'Preview'}
                </Button>
              </div>

              {singleViewMode === 'preview' ? (
                selectedGame ? (
                  <LyricsGame date={format(selectedDates[0], 'yyyy-MM-dd')} />
                ) : (
                  <div className="p-4 text-center text-muted">
                    No game scheduled for this date
                  </div>
                )
              ) : (
                <GameEditor
                  mode="preview"
                  onModeChange={() => {}}
                  selectedDate={selectedDates[0]}
                  game={selectedGame as AdminGame}
                  onGameUpdate={handleGameUpdate}
                  onGameDelete={handleGameDelete}
                  onRandomSongAssign={assignRandomSongToDate}
                  selectedPlaylist={selectedPlaylist}
                  onPlaylistChange={onPlaylistChange}
                  pendingChange={pendingChanges[format(selectedDates[0], 'yyyy-MM-dd')]}
                />
              )}
            </div>
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