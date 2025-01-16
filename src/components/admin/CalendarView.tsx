'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';

interface Game {
  id: string;
  date: string;
  songId: string;
  song: {
    title: string;
    artist: string;
  };
}

interface CalendarViewProps {
  games: Game[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export function CalendarView({ games, onDateSelect, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week of the first day (0 = Sunday)
  const startDay = monthStart.getDay();
  
  // Create empty slots for padding
  const emptyDays = Array(startDay).fill(null);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty days from previous month */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-12" />
        ))}

        {/* Days of current month */}
        {monthDays.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const game = games.find(g => g.date === dateStr);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const dayIsToday = isToday(date);

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(date)}
              className={`
                h-12 flex flex-col items-center justify-center relative
                rounded-lg transition-colors
                ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}
                ${dayIsToday ? 'font-bold' : ''}
              `}
            >
              <span className={dayIsToday ? 'text-blue-600' : ''}>
                {format(date, 'd')}
              </span>
              {game && (
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-white' : 'bg-green-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 