import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AdminGame } from '@/types/admin';
import { Calendar } from './Calendar';
import { PlaylistBrowser } from './PlaylistBrowser';
import { GamePreview } from './GamePreview';

export function AdminDashboard() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [mode, setMode] = useState<'playlist' | 'game'>('game');
  const [selectedGame, setSelectedGame] = useState<AdminGame | undefined>(undefined);

  useEffect(() => {
    fetchGames();
  }, [currentMonth]);

  const fetchGames = async () => {
    try {
      const month = format(currentMonth, 'yyyy-MM');
      const response = await fetch(`/api/admin/games?month=${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  const handleSelectDate = (dates: Date[]) => {
    setSelectedDates(dates);
    if (dates.length === 1) {
      const game = games.find(g => format(new Date(g.date), 'yyyy-MM-dd') === format(dates[0], 'yyyy-MM-dd'));
      setSelectedGame(game || undefined);
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/admin/spotify/playlists/${playlistId}/tracks`);
      if (!response.ok) {
        throw new Error('Failed to fetch playlist tracks');
      }
      await response.json();
      setMode('game');
    } catch (error) {
      console.error('Failed to fetch playlist tracks:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-[60%] border-r border-foreground/10">
        <Calendar
          selectedDates={selectedDates}
          onSelect={handleSelectDate}
          games={games}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />
      </div>
      
      <div className="w-[40%]">
        {mode === 'playlist' ? (
          <PlaylistBrowser
            onSelect={handleSelectPlaylist}
            onCancel={() => setMode('game')}
          />
        ) : (
          <GamePreview
            game={selectedGame}
            selectedDates={selectedDates}
            onSearchClick={() => setMode('playlist')}
            isMultiSelectMode={selectedDates.length > 1}
            games={games}
          />
        )}
      </div>
    </div>
  );
} 