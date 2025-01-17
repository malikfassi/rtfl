import React, { useState } from 'react';
import { format, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { AdminGame } from '@/types/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface CalendarProps {
  selectedDates: Date[];
  onSelect: (dates: Date[]) => void;
  games: AdminGame[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  game: AdminGame | null;
  isUpdating?: boolean;
  updateStatus?: 'success' | 'error';
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseDown: () => void;
}

function CalendarDay({ date, isSelected, game, isUpdating, updateStatus, onClick, onMouseEnter, onMouseDown }: CalendarDayProps) {
  const isToday = isSameDay(date, new Date());
  const hasGame = Boolean(game);

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      className={cn(
        "h-24 p-2 relative text-left transition-colors",
        "border border-foreground/10",
        isSelected && "bg-primary/10",
        isToday && "font-bold",
        isUpdating && "border-primary",
        updateStatus === 'success' && "border-green-500",
        updateStatus === 'error' && "border-red-500",
        !isSelected && "hover:bg-primary/5"
      )}
    >
      <span className="text-xs text-muted">{format(date, 'd')}</span>
      {hasGame && game && (
        <div className="mt-2 space-y-1">
          <div className="text-sm truncate">{game.song.title}</div>
          <div className="text-xs text-muted truncate">{game.song.artist}</div>
          {isUpdating && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="animate-spin">⟳</div>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(date: Date): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  // Add days from previous month to start from Sunday
  while (start.getDay() > 0) {
    start.setDate(start.getDate() - 1);
  }
  
  // Add days from next month to end on Saturday
  while (end.getDay() < 6) {
    end.setDate(end.getDate() + 1);
  }
  
  const days: Date[] = [];
  let current = new Date(start);
  
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

export function Calendar({ selectedDates, onSelect, games, currentMonth, onMonthChange }: CalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);

  const handleDayClick = (date: Date) => {
    if (!isDragging) {
      onSelect([date]);
    }
  };

  const handleDayMouseDown = (date: Date) => {
    setIsDragging(true);
    setDragStartDate(date);
    onSelect([date]);
  };

  const handleDayMouseEnter = (date: Date) => {
    if (isDragging && dragStartDate) {
      const start = dragStartDate < date ? dragStartDate : date;
      const end = dragStartDate < date ? date : dragStartDate;
      const dates = eachDayOfInterval({ start, end });
      onSelect(dates);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDate(null);
  };

  const toggleSelectAll = () => {
    if (selectedDates.length > 0) {
      onSelect([]);
    } else {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const allDates = eachDayOfInterval({ start, end });
      onSelect(allDates);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="p-8" onMouseUp={handleMouseUp}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-mono">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <button 
        onClick={toggleSelectAll}
        className="text-sm hover:text-primary transition-colors mb-4"
      >
        {selectedDates.length > 0 ? 'Deselect All' : 'Select All'}
      </button>

      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map(day => (
          <div key={day} className="p-2 text-center text-sm text-muted">
            {day}
          </div>
        ))}

        {getDaysInMonth(currentMonth).map((day, i) => {
          const isSelected = selectedDates.some(d => isSameDay(d, day));
          const game = games.find(game => isSameDay(new Date(game.date), day)) || null;

          return (
            <CalendarDay
              key={i}
              date={day}
              isSelected={isSelected}
              game={game}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => handleDayMouseEnter(day)}
              onMouseDown={() => handleDayMouseDown(day)}
            />
          );
        })}
      </div>
    </div>
  );
} 