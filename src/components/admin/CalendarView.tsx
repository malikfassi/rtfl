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
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full max-w-4xl mx-auto font-mono">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={handlePrevMonth} className="text-xl hover:text-primary">
          {'<-'}
        </button>
        <h2 className="text-lg tracking-tight">
          {format(currentMonth, 'MM.yyyy')}
        </h2>
        <button onClick={handleNextMonth} className="text-xl hover:text-primary">
          {'->'}
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-4">
        {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
          <div key={day} className="text-center text-sm opacity-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Empty days from previous month */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day opacity-0">
            {'00'}
          </div>
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
                calendar-day
                ${isSelected ? 'calendar-day-selected' : ''}
                ${dayIsToday ? 'calendar-day-today' : ''}
                ${game ? 'calendar-day-has-game' : ''}
              `}
            >
              <span>{format(date, 'dd')}</span>
              {game && (
                <span className="text-[10px] mt-0.5 text-light-purple">
                  {`> ${game.song.title}`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 