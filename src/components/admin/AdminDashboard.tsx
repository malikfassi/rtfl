'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { GameEditor } from './GameEditor';

interface Game {
  id: number;
  date: Date;
  playlistId: string;
  randomSeed: number;
  overrideSongId: string | null;
}

export function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) throw new Error('Failed to fetch games');
        const { games } = await response.json();
        setGames(games.map((game: Game) => ({ ...game, date: new Date(game.date) })));
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGames();
  }, []);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  const selectedGame = games.find(game => isSameDay(game.date, selectedDate));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium py-1">
                {day}
              </div>
            ))}
            {monthDays.map(date => {
              const hasGame = games.some(game => isSameDay(game.date, date));
              const isSelected = isSameDay(date, selectedDate);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    p-2 text-center rounded-md transition-colors
                    ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
                    ${hasGame ? 'font-bold' : 'font-normal'}
                  `}
                >
                  {format(date, 'd')}
                  {hasGame && (
                    <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            Game for {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          ) : (
            <GameEditor
              date={selectedDate}
              gameData={selectedGame || null}
            />
          )}
        </div>
      </div>
    </div>
  );
} 