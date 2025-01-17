import React, { useState } from 'react';
import { format, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { AdminGame, GameStatus, GameStatusInfo } from '@/types/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface CalendarProps {
  selectedDates: Date[];
  onSelect: (dates: Date[]) => void;
  games: AdminGame[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  pendingChanges?: Record<string, GameStatusInfo>;
  onDayUnselect?: (date: Date) => void;
}

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  game: AdminGame | null;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseDown: () => void;
  status?: GameStatusInfo;
}

function getStatusColor(status: GameStatus): string {
  switch (status) {
    case 'to-create':
      return 'border-yellow-500';
    case 'to-edit':
      return 'border-blue-500';
    case 'loading':
      return 'border-primary animate-pulse';
    case 'success':
      return 'border-green-500';
    case 'error':
      return 'border-red-500';
    default:
      return '';
  }
}

function CalendarDay({ date, isSelected, game, onClick, onMouseEnter, onMouseDown, status }: CalendarDayProps) {
  const isToday = isSameDay(date, new Date());
  const hasGame = Boolean(game);
  const dayStatus = status || game?.status;

  const statusColor = dayStatus ? getStatusColor(dayStatus.status) : '';
  const isLoading = dayStatus?.status === 'loading';

  const renderTooltipContent = () => {
    if (!dayStatus) return null;
    
    switch (dayStatus.status) {
      case 'to-edit':
        return (
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted">Current:</div>
              <div>{dayStatus.currentSong?.title} - {dayStatus.currentSong?.artist}</div>
            </div>
            <div>
              <div className="text-xs text-muted">New:</div>
              <div>{dayStatus.newSong?.title} - {dayStatus.newSong?.artist}</div>
            </div>
          </div>
        );
      case 'to-create':
        return (
          <div>
            <div className="text-xs text-muted">To be created:</div>
            <div>{dayStatus.newSong?.title} - {dayStatus.newSong?.artist}</div>
          </div>
        );
      case 'loading':
        return (
          <div>
            <div className="text-xs text-muted">Updating game...</div>
          </div>
        );
      case 'success':
        return (
          <div>
            <div className="text-xs text-muted">Successfully updated!</div>
          </div>
        );
      case 'error':
        return (
          <div>
            <div className="text-xs text-muted text-red-500">Failed to update</div>
            {dayStatus.error && <div className="text-xs text-red-500">{dayStatus.error}</div>}
          </div>
        );
      default:
        return null;
    }
  };

  const tooltipContent = renderTooltipContent();

  const dayContent = (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      className={cn(
        "h-32 p-3 relative text-left transition-colors overflow-hidden",
        "border-2",
        statusColor || "border-foreground/10",
        isSelected && "bg-primary/10",
        isToday && "font-bold",
        !isSelected && "hover:bg-primary/5",
        dayStatus?.status === 'to-create' && "bg-yellow-500/5",
        dayStatus?.status === 'error' && "bg-red-500/5"
      )}
    >
      <span className="text-sm font-medium text-muted">{format(date, 'd')}</span>
      {(hasGame || dayStatus?.newSong) && (
        <div className="mt-1.5 space-y-1.5">
          {dayStatus?.status === 'to-edit' && dayStatus.currentSong && (
            <div className="space-y-0.5 opacity-50">
              <div className="text-[13px] leading-tight truncate line-through">{dayStatus.currentSong.title}</div>
              <div className="text-[11px] leading-tight truncate text-muted/80 line-through">{dayStatus.currentSong.artist}</div>
            </div>
          )}
          <div className={cn(
            "text-[13px] leading-tight font-medium truncate",
            dayStatus?.status === 'to-create' && "text-yellow-600",
            dayStatus?.status === 'error' && "text-red-600"
          )}>
            {dayStatus?.newSong?.title || game?.song.title}
          </div>
          <div className={cn(
            "text-[11px] leading-tight truncate",
            dayStatus?.status === 'to-create' ? "text-yellow-600/70" : "text-muted/80",
            dayStatus?.status === 'error' && "text-red-600/70"
          )}>
            {dayStatus?.newSong?.artist || game?.song.artist}
          </div>
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="animate-spin text-xl">⟳</div>
            </div>
          )}
        </div>
      )}
    </button>
  );

  return tooltipContent ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {dayContent}
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : dayContent;
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

export function Calendar({ 
  selectedDates, 
  onSelect, 
  games, 
  currentMonth, 
  onMonthChange,
  pendingChanges = {},
  onDayUnselect
}: CalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);

  const handleDayClick = (date: Date) => {
    if (!isDragging) {
      const isSelected = selectedDates.some(d => isSameDay(d, date));
      
      if (isSelected && onDayUnselect) {
        onDayUnselect(date);
      } else {
        onSelect([date]);
      }
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
          const dateStr = format(day, 'yyyy-MM-dd');
          const game = games.find(game => isSameDay(new Date(game.date), day)) || null;
          const status = pendingChanges[dateStr];

          return (
            <CalendarDay
              key={i}
              date={day}
              isSelected={isSelected}
              game={game}
              status={status}
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