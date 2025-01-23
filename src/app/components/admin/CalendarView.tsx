'use client';

import React, { useState, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  isAfter,
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
  onDateSelect: (date: Date, multiSelect: boolean) => void;
  selectedDates: Date[];
  isMultiSelectMode?: boolean;
}

export function CalendarView({ 
  games, 
  onDateSelect, 
  selectedDates,
  isMultiSelectMode = false 
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const padNumber = (num: number) => num.toString().padStart(2, '0');

  const handleDateClick = useCallback((date: Date, event: React.MouseEvent) => {
    const isShiftKey = event.shiftKey && isMultiSelectMode;
    
    if (isShiftKey && lastSelectedDate) {
      // Calculate the range of dates between last selected and current
      const start = isBefore(lastSelectedDate, date) ? lastSelectedDate : date;
      const end = isAfter(lastSelectedDate, date) ? lastSelectedDate : date;
      const dateRange = eachDayOfInterval({ start, end });
      
      // Call onDateSelect with the entire range
      dateRange.forEach(d => onDateSelect(d, true));
    } else {
      onDateSelect(date, isMultiSelectMode);
      setLastSelectedDate(date);
    }
  }, [lastSelectedDate, onDateSelect, isMultiSelectMode]);

  const isDateSelected = useCallback((date: Date) => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  }, [selectedDates]);

  return (
    <div className="calendar-container p-4">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav">
          {'<-'}
        </button>
        <h2 className="calendar-month">
          {format(currentMonth, 'MM.yyyy')}
        </h2>
        <button onClick={handleNextMonth} className="calendar-nav">
          {'->'}
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="calendar-weekdays">
        {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Empty days from previous month */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-empty-day">
            00
          </div>
        ))}

        {/* Days of current month */}
        {monthDays.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const game = games.find(g => g.date === dateStr);
          const isSelected = isDateSelected(date);
          const dayIsToday = isToday(date);

          return (
            <button
              key={dateStr}
              onClick={(e) => handleDateClick(date, e)}
              className={`calendar-day ${dayIsToday ? 'calendar-day-today' : ''} ${
                isSelected ? 'calendar-day-selected' : ''
              }`}
            >
              <div className="calendar-day-content">
                <div>
                  {padNumber(date.getDate())}
                </div>
                {game && (
                  <div className="calendar-day-title">
                    {game.song.title}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <div className="calendar-selected-date">
          <span className="calendar-selected-date-arrow">{'>'}</span>
          {selectedDates.length === 1 
            ? format(selectedDates[0], 'MM.dd.yyyy')
            : `${selectedDates.length} dates selected`}
        </div>
      )}
    </div>
  );
} 