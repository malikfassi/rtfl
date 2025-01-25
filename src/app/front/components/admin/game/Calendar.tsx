import { eachDayOfInterval, format, isSameDay } from 'date-fns';
import React, { useCallback, useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import { cn } from '@/app/front/lib/utils';
import type { GameStatusInfo } from '@/app/types/admin';

interface Game {
  id: string;
  date: string;
  song: {
    id: string;
    title: string;
    artist: string;
  };
  status?: GameStatusInfo;
}

function getTrackTitle(track: { name: string } | null | undefined) {
  return track?.name || '';
}

function getTrackArtist(track: { artists: { name: string }[] } | null | undefined) {
  return track?.artists[0]?.name || '';
}

function getTrackId(track: { id: string } | null | undefined) {
  return track?.id || '';
}

interface CalendarProps {
  selectedDates: Date[];
  onSelect: (dates: Date[]) => void;
  games: Game[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  pendingChanges?: Record<string, GameStatusInfo>;
}

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  game: Game | null;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseDown: () => void;
  status?: GameStatusInfo;
}

function CalendarDay({ date, isSelected, game, onClick, onMouseEnter, onMouseDown, status }: CalendarDayProps) {
  const isToday = isSameDay(date, new Date());
  const hasGame = Boolean(game);
  const dayStatus = status || game?.status;
  const isCurrentMonth = date.getMonth() === new Date().getMonth();
  const isLoading = dayStatus?.status === 'loading';

  // Get background and border colors based on state
  const getStateStyles = () => {
    if (dayStatus?.status === 'to-create') return 'bg-yellow-500/10 border-yellow-500';
    if (dayStatus?.status === 'to-edit') return 'bg-blue-500/10 border-blue-500';
    if (dayStatus?.status === 'loading') return 'bg-blue-500/10 border-blue-500 animate-pulse';
    if (hasGame) return 'bg-green-500/10 border-green-500';
    return 'hover:bg-gray-100 border-transparent';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      disabled={isLoading}
      className={cn(
        'w-full aspect-square p-2 border-2 rounded transition-colors relative',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        !isCurrentMonth && 'opacity-50',
        getStateStyles()
      )}
    >
      <div className="text-sm font-medium">{format(date, 'd')}</div>
      {game && (
        <div className="mt-1">
          <div className="text-xs font-medium truncate">{game.song.title}</div>
          <div className="text-xs text-muted truncate">{game.song.artist}</div>
        </div>
      )}
      {isToday && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
      )}
    </button>
  );
}

function getDaysInMonth(date: Date): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Get the first day of the week for the start date
  const firstDayOfWeek = start.getDay();
  const lastDayOfWeek = end.getDay();

  // Adjust start date to include days from previous month to fill the first week
  const adjustedStart = new Date(start);
  adjustedStart.setDate(start.getDate() - firstDayOfWeek);

  // Adjust end date to include days from next month to fill the last week
  const adjustedEnd = new Date(end);
  adjustedEnd.setDate(end.getDate() + (6 - lastDayOfWeek));

  return eachDayOfInterval({ start: adjustedStart, end: adjustedEnd });
}

export function Calendar({ 
  selectedDates, 
  onSelect, 
  games, 
  currentMonth, 
  onMonthChange,
  pendingChanges = {}
}: CalendarProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const days = getDaysInMonth(currentMonth);

  const handleDateClick = useCallback((date: Date) => {
    if (selectedDates.some(d => isSameDay(d, date))) {
      onSelect(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      onSelect([...selectedDates, date]);
    }
  }, [selectedDates, onSelect]);

  const handleMouseDown = useCallback((date: Date) => {
    setIsSelecting(true);
    setSelectionStart(date);
    // Don't reset selection on mouse down, just add to it if not already selected
    if (!selectedDates.some(d => isSameDay(d, date))) {
      onSelect([...selectedDates, date]);
    }
  }, [selectedDates, onSelect]);

  const handleMouseEnter = useCallback((date: Date) => {
    setHoverDate(date);
    if (isSelecting && selectionStart) {
      const start = selectionStart;
      const end = date;
      
      // Get all dates between start and end
      const startTime = Math.min(start.getTime(), end.getTime());
      const endTime = Math.max(start.getTime(), end.getTime());
      const dates = [];
      
      for (let time = startTime; time <= endTime; time += 24 * 60 * 60 * 1000) {
        dates.push(new Date(time));
      }
      
      // Merge with existing selection, removing duplicates
      const newDates = [...selectedDates];
      dates.forEach(date => {
        if (!selectedDates.some(d => isSameDay(d, date))) {
          newDates.push(date);
        }
      });
      onSelect(newDates);
    }
  }, [isSelecting, selectionStart, selectedDates, onSelect]);

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
    setHoverDate(null);
  };

  return (
    <div 
      className="select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted">
            {day}
          </div>
        ))}

        {days.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const game = games.find(g => format(new Date(g.date), 'yyyy-MM-dd') === dateStr);
          const isSelected = selectedDates.some(d => isSameDay(d, date));
          const status = pendingChanges[dateStr];

          return (
            <CalendarDay
              key={dateStr}
              date={date}
              isSelected={isSelected}
              game={game || null}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => handleMouseEnter(date)}
              onMouseDown={() => handleMouseDown(date)}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
} 