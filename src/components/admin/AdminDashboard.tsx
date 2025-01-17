'use client';

import React, { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { AdminGame } from '@/types/admin';
import { Calendar } from './game/Calendar';
import { GameEditor } from './game/GameEditor';
import { BatchGameEditor } from './game/BatchGameEditor';

export function AdminDashboard() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [previewGames, setPreviewGames] = useState<AdminGame[]>([]);

  useEffect(() => {
    fetchGames();
  }, [currentMonth]);

  const fetchGames = async () => {
    try {
      const monthParam = format(currentMonth, 'yyyy-MM');
      const response = await fetch(`/api/admin/games?month=${monthParam}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(data);
      setPreviewGames([]); // Clear preview games when fetching new games
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  const handleSelectDate = (dates: Date[]) => {
    setSelectedDates(dates);
    if (dates.length <= 1) {
      setPreviewGames([]); // Clear preview games when deselecting dates
    }
  };

  const handlePreview = (preview: AdminGame[]) => {
    // Replace any existing games for the selected dates with preview games
    setPreviewGames(preview);
  };

  // Combine real games with preview games
  const displayedGames = [
    ...games.filter(game => 
      !previewGames.some(preview => preview.date === game.date)
    ),
    ...previewGames
  ];

  return (
    <div className="flex h-full">
      <div className="w-[60%] border-r border-foreground/10">
        <Calendar
          selectedDates={selectedDates}
          onSelect={handleSelectDate}
          games={displayedGames}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />
      </div>
      <div className="w-[40%]">
        {selectedDates.length === 1 ? (
          <GameEditor
            selectedDate={selectedDates[0]}
            game={games.find(g => isSameDay(new Date(g.date), selectedDates[0]))}
            onGameUpdate={fetchGames}
          />
        ) : selectedDates.length > 1 && (
          <BatchGameEditor
            dates={selectedDates}
            onCancel={() => {
              setSelectedDates([]);
              setPreviewGames([]);
            }}
            onComplete={() => {
              fetchGames();
              setSelectedDates([]);
            }}
            onPreview={handlePreview}
          />
        )}
      </div>
    </div>
  );
} 