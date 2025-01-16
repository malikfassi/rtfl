'use client';

import { useState } from 'react';
import { PlaylistBrowser } from './game/PlaylistBrowser';
import { PlaylistSongBrowser } from './game/PlaylistSongBrowser';
import { GameEditor } from './GameEditor';
import { CalendarView } from './CalendarView';
import { Playlist, SpotifyTrack } from '@/types/admin';
import { useGames } from '@/hooks/use-games';
import { startOfMonth, format } from 'date-fns';

export function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [mode, setMode] = useState<'calendar' | 'playlist'>('calendar');
  
  // Get the first day of the month for the selected date or current month
  const monthDate = selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date());
  const { data: games = [] } = useGames(monthDate);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setMode('calendar');
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylistId(playlist.id);
    setMode('playlist');
  };

  const handleSongSelect = (track: SpotifyTrack) => {
    // TODO: Implement song selection logic
    console.log('Selected track:', track);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-md overflow-y-auto">
        {mode === 'calendar' ? (
          <CalendarView
            games={games}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        ) : (
          <PlaylistBrowser
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={handlePlaylistSelect}
            enabled={mode === 'playlist'}
          />
        )}
        <div className="p-4 border-t">
          <button
            onClick={() => setMode(mode === 'calendar' ? 'playlist' : 'calendar')}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Switch to {mode === 'calendar' ? 'Playlists' : 'Calendar'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'calendar' ? (
          selectedDate ? (
            <GameEditor 
              date={format(selectedDate, 'yyyy-MM-dd')}
            />
          ) : (
            <div className="p-4 text-gray-500 text-center">
              Select a date to create or edit a game
            </div>
          )
        ) : (
          <PlaylistSongBrowser
            playlistId={selectedPlaylistId}
            onSelectSong={handleSongSelect}
          />
        )}
      </div>
    </div>
  );
} 