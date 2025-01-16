'use client';

import { useState } from 'react';
import { PlaylistBrowser } from './PlaylistBrowser';
import { PlaylistSongBrowser } from './PlaylistSongBrowser';
import { GameEditor } from './GameEditor';
import { CalendarView } from './CalendarView';

interface Game {
  id: string;
  date: string;
  songId: string;
  song: {
    title: string;
    artist: string;
  };
}

export function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'calendar' | 'playlist'>('calendar');
  // TODO: Implement fetching and updating games
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [games, setGames] = useState<Game[]>([]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setMode('calendar');
  };

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setMode('playlist');
  };

  const handleSongSelect = (trackId: string) => {
    setSelectedTrackId(trackId);
  };

  const handleGameSave = async (gameData: Partial<Game>) => {
    // TODO: Implement game save logic
    console.log('Saving game:', gameData);
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
          <PlaylistBrowser onPlaylistSelect={handlePlaylistSelect} />
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
            <GameEditor onSave={handleGameSave} />
          ) : (
            <div className="p-4 text-gray-500 text-center">
              Select a date to create or edit a game
            </div>
          )
        ) : (
          <PlaylistSongBrowser
            playlistId={selectedPlaylistId}
            onSongSelect={handleSongSelect}
            selectedTrackId={selectedTrackId}
          />
        )}
      </div>
    </div>
  );
} 