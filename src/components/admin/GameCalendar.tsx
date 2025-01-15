'use client';

import { useState } from 'react';
import type { Game } from '@prisma/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface GameCalendarProps {
  games: Game[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  isLoading?: boolean;
}

export function GameCalendar({ games, onSelectDate, selectedDate, isLoading = false }: GameCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get games for the current month
  const gamesByDate = games.reduce((acc, game) => {
    const date = new Date(game.date);
    acc[format(date, 'yyyy-MM-dd')] = game;
    return acc;
  }, {} as Record<string, Game>);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Game Calendar</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            ←
          </button>
          <span className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Calendar grid */}
        {days.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const game = gamesByDate[dateKey];
          const isSelected = selectedDate && isSameDay(date, selectedDate);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(date)}
              disabled={isLoading}
              className={`
                aspect-square p-2 rounded-lg border relative
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${game ? 'hover:border-blue-300' : 'hover:border-gray-300'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm">{format(date, 'd')}</div>
              {game && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 