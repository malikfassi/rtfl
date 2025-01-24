import { eachDayOfInterval,format, isSameDay } from 'date-fns';
import React, { useCallback,useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import { cn } from '@/app/front/lib/utils';
import type { AdminGame, GameStatusInfo } from '@/app/types/admin';

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
  games: AdminGame[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  pendingChanges?: Record<string, GameStatusInfo>;
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
    if (dayStatus?.status === 'success') return 'bg-green-500/10 border-green-500';
    if (dayStatus?.status === 'error') return 'bg-red-500/10 border-red-500';
    if (isSelected) return 'bg-blue-500/10 border-blue-500';
    return 'border-foreground/10';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      className={cn(
        "aspect-square p-1.5 relative text-left transition-colors overflow-hidden",
        "border-2",
        getStateStyles(),
        isSelected && !dayStatus?.status && "bg-blue-500/10"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-1 text-[10px] font-medium",
        isToday ? "text-primary" : "text-muted/50",
        !isCurrentMonth && "text-muted/30"
      )}>
        {format(date, 'd')}
      </span>
      
      <div className="mt-3 space-y-0.5">
        {!hasGame && !dayStatus?.newSong ? (
          // Empty state
          <>
            <div key="empty-title" className="text-[11px] leading-tight text-emerald-500">NO GAME</div>
            <div key="empty-artist" className="text-[10px] leading-tight text-red-500">NULL</div>
            <div key="empty-id" className="text-[9px] leading-tight text-blue-500 font-mono">ID: NULL</div>
          </>
        ) : (
          <>
            {/* Show current song if being edited */}
            {dayStatus?.status === 'to-edit' && dayStatus.currentSong && (
              <div className="space-y-0.5">
                {/* Before values (struck through) */}
                <div key="old-title" className="text-[11px] leading-tight text-green-500/70 line-through decoration-1 truncate max-w-[95%]">
                  {getTrackTitle(dayStatus.currentSong)}
                </div>
                <div key="old-artist" className="text-[10px] leading-tight text-red-500/70 line-through decoration-1 truncate max-w-[95%]">
                  {getTrackArtist(dayStatus.currentSong)}
                </div>
                <div key="old-id" className="text-[9px] leading-tight text-blue-500/70 font-mono line-through decoration-1 truncate max-w-[95%]">
                  {getTrackId(dayStatus.currentSong)}
                </div>
                
                {/* After values */}
                <div key="new-title" className="text-[11px] leading-tight text-green-500 truncate max-w-[95%]">
                  {getTrackTitle(dayStatus?.newSong)}
                </div>
                <div key="new-artist" className="text-[10px] leading-tight text-red-500 truncate max-w-[95%]">
                  {getTrackArtist(dayStatus?.newSong)}
                </div>
                <div key="new-id" className="text-[9px] leading-tight text-blue-500 font-mono truncate max-w-[95%]">
                  {getTrackId(dayStatus?.newSong)}
                </div>
              </div>
            )}
            
            {/* Show new/current song if not editing */}
            {dayStatus?.status !== 'to-edit' && (
              <>
                <div key="title" className="text-[11px] leading-tight text-green-500 truncate max-w-[95%]">
                  {getTrackTitle(dayStatus?.newSong as { name: string } | null | undefined) || 
                   getTrackTitle(game?.song.spotifyData as { name: string } | null | undefined)}
                </div>
                <div key="artist" className="text-[10px] leading-tight text-red-500 truncate max-w-[95%]">
                  {getTrackArtist(dayStatus?.newSong as { artists: { name: string }[] } | null | undefined) || 
                   getTrackArtist(game?.song.spotifyData as { artists: { name: string }[] } | null | undefined)}
                </div>
                <div key="id" className="text-[9px] leading-tight text-blue-500 font-mono truncate max-w-[95%]">
                  {getTrackId(dayStatus?.newSong as { id: string } | null | undefined) || game?.song.spotifyId}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Status indicators */}
      {isLoading && (
        <div className="absolute top-0.5 right-1 rounded-full bg-orange-500/20 p-0.5">
          <div className="animate-spin text-[10px] text-orange-500">⟳</div>
        </div>
      )}
      {dayStatus?.status === 'success' && (
        <div className="absolute top-0.5 right-1 text-[10px] text-green-500">✓</div>
      )}
      {dayStatus?.status === 'error' && (
        <div className="absolute top-0.5 right-1 text-[10px] text-red-500">✕</div>
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

export function Calendar({ 
  selectedDates, 
  onSelect, 
  games, 
  currentMonth, 
  onMonthChange,
  pendingChanges = {}
}: CalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const prevStatesRef = React.useRef<Record<string, GameStatusInfo>>({});

  // Log props and state changes
  React.useEffect(() => {
    // Log state transitions
    Object.entries(pendingChanges).forEach(([date, status]) => {
      const prevStatus = prevStatesRef.current[date];
      if (prevStatus?.status !== status.status) {
        console.log(
          `Calendar: ${date} - ${prevStatus?.status || 'none'} → ${status.status}` +
          (status.error ? ` (Error: ${status.error})` : '') +
          (status.newSong ? ` [${getTrackTitle(status.newSong)} - spotifyId: ${getTrackId(status.newSong)}]` : '')
        );
      }
    });

    // Log request summaries
    const inProgress = Object.entries(pendingChanges)
      .filter(([, status]) => status.status === 'loading')
      .map(([date]) => date);
    
    const completed = Object.entries(pendingChanges)
      .filter(([, status]) => status.status === 'success')
      .map(([date]) => date);
    
    const failed = Object.entries(pendingChanges)
      .filter(([, status]) => status.status === 'error')
      .map(([date]) => date);
    
    const pending = Object.entries(pendingChanges)
      .filter(([, status]) => status.status === 'to-create' || status.status === 'to-edit')
      .map(([date]) => date);

    if (inProgress.length > 0) {
      console.log(`Calendar: Requests in progress: ${inProgress.join(', ')}`);
    }
    if (completed.length > 0) {
      console.log(`Calendar: Completed requests: ${completed.join(', ')}`);
    }
    if (failed.length > 0) {
      console.log(`Calendar: Failed requests: ${failed.join(', ')}`);
    }
    if (pending.length > 0) {
      console.log(`Calendar: Pending requests: ${pending.join(', ')}`);
    }

    // Store current states for next comparison
    prevStatesRef.current = pendingChanges;
  }, [pendingChanges]);

  const handleDayClick = useCallback((date: Date) => {
    // No-op - we'll handle everything in mousedown
    console.log('Calendar: Day click (no-op)', {
      date: format(date, 'yyyy-MM-dd')
    });
  }, []);

  const handleDayMouseDown = useCallback((date: Date) => {
    const isSelected = selectedDates.some(d => isSameDay(d, date));
    const isMultiSelect = selectedDates.length > 1;
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && 
                          date.getFullYear() === currentMonth.getFullYear();

    console.log('Calendar: Mouse down', {
      date: format(date, 'yyyy-MM-dd'),
      isCurrentMonth,
      isSelected,
      isMultiSelect,
      selectedDates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
    });

    if (isMultiSelect && isSelected) {
      console.log('Calendar: Removing date in multi-select mode');
      // Remove the date from selection
      const newDates = selectedDates.filter(d => !isSameDay(d, date));
      onSelect(newDates);
      return;
    }

    if (!isCurrentMonth) {
      console.log('Calendar: Changing month');
      onMonthChange(date);
    }

    setIsDragging(true);
    setDragStartDate(date);
    onSelect([date]);
  }, [selectedDates, currentMonth, onSelect, onMonthChange]);

  const handleDayMouseEnter = useCallback((date: Date) => {
    if (!isDragging || !dragStartDate) return;

    const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && 
                          date.getFullYear() === currentMonth.getFullYear();

    if (!isCurrentMonth) return;

    const start = dragStartDate < date ? dragStartDate : date;
    const end = dragStartDate < date ? date : dragStartDate;

    const dates = eachDayOfInterval({ start, end });
    onSelect(dates);
  }, [isDragging, dragStartDate, currentMonth, onSelect]);

  React.useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStartDate(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <Button 
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))} 
            variant="secondary" 
            size="sm"
          >
            {'<<'}
          </Button>
          <Button 
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} 
            variant="secondary" 
            size="sm"
          >
            {'<'}
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} 
            variant="secondary" 
            size="sm"
          >
            {'>'}
          </Button>
          <Button 
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))} 
            variant="secondary" 
            size="sm"
          >
            {'>>'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(date => {
          const game = games.find(g => isSameDay(new Date(g.date), date));
          const isSelected = selectedDates.some(d => isSameDay(d, date));
          const status = pendingChanges[format(date, 'yyyy-MM-dd')];

          return (
            <CalendarDay
              key={date.toISOString()}
              date={date}
              isSelected={isSelected}
              game={game || null}
              onClick={() => handleDayClick(date)}
              onMouseEnter={() => handleDayMouseEnter(date)}
              onMouseDown={() => handleDayMouseDown(date)}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
} 