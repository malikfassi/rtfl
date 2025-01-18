import React, { useState, useCallback } from 'react';
import { format, isSameDay, addMonths, subMonths, eachDayOfInterval } from 'date-fns';
import type { AdminGame, GameStatusInfo } from '@/types/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

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
            <div className="text-[11px] leading-tight text-emerald-500">NO GAME</div>
            <div className="text-[10px] leading-tight text-red-500">NULL</div>
            <div className="text-[9px] leading-tight text-blue-500 font-mono">ID: NULL</div>
          </>
        ) : (
          <>
            {/* Show current song if being edited */}
            {dayStatus?.status === 'to-edit' && dayStatus.currentSong && (
              <div className="space-y-0.5">
                {/* Before values (struck through) */}
                <div className="text-[11px] leading-tight text-green-500/70 line-through decoration-1 truncate max-w-[95%]">
                  {dayStatus.currentSong.title}
                </div>
                <div className="text-[10px] leading-tight text-red-500/70 line-through decoration-1 truncate max-w-[95%]">
                  {dayStatus.currentSong.artist}
                </div>
                <div className="text-[9px] leading-tight text-blue-500/70 font-mono line-through decoration-1 truncate max-w-[95%]">
                  {dayStatus.currentSong.spotifyId}
                </div>
                
                {/* After values */}
                <div className="text-[11px] leading-tight text-green-500 truncate max-w-[95%]">
                  {dayStatus?.newSong?.title}
                </div>
                <div className="text-[10px] leading-tight text-red-500 truncate max-w-[95%]">
                  {dayStatus?.newSong?.artist}
                </div>
                <div className="text-[9px] leading-tight text-blue-500 font-mono truncate max-w-[95%]">
                  {dayStatus?.newSong?.spotifyId}
                </div>
              </div>
            )}
            
            {/* Show new/current song if not editing */}
            {dayStatus?.status !== 'to-edit' && (
              <>
                <div className="text-[11px] leading-tight text-green-500 truncate max-w-[95%]">
                  {dayStatus?.newSong?.title || game?.song.title}
                </div>
                <div className="text-[10px] leading-tight text-red-500 truncate max-w-[95%]">
                  {dayStatus?.newSong?.artist || game?.song.artist}
                </div>
                <div className="text-[9px] leading-tight text-blue-500 font-mono truncate max-w-[95%]">
                  {dayStatus?.newSong?.spotifyId || game?.song.spotifyId}
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
          (status.newSong ? ` [${status.newSong.title} - spotifyId: ${status.newSong.spotifyId}]` : '')
        );
      }
    });

    // Log request summaries
    const inProgress = Object.entries(pendingChanges)
      .filter(([_, status]) => status.status === 'loading')
      .map(([date]) => date);
    
    const completed = Object.entries(pendingChanges)
      .filter(([_, status]) => status.status === 'success')
      .map(([date]) => date);
    
    const failed = Object.entries(pendingChanges)
      .filter(([_, status]) => status.status === 'error')
      .map(([date]) => date);
    
    const pending = Object.entries(pendingChanges)
      .filter(([_, status]) => status.status === 'to-create' || status.status === 'to-edit')
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

  const handleDayClick = useCallback((_date: Date) => {
    // No-op - we'll handle everything in mousedown
    console.log('Calendar: Day click (no-op)', {
      date: format(_date, 'yyyy-MM-dd')
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

    setIsDragging(true);
    setDragStartDate(date);

    if (!isMultiSelect) {
      // Single selection mode
      onSelect([date]);
    } else if (!isSelected) {
      // Add to multi-selection
      onSelect([...selectedDates, date]);
    }
  }, [selectedDates, onSelect, currentMonth]);

  const handleDayMouseEnter = useCallback((date: Date) => {
    if (!isDragging || !dragStartDate) return;

    const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && 
                          date.getFullYear() === currentMonth.getFullYear();

    console.log('Calendar: Mouse enter during drag', {
      date: format(date, 'yyyy-MM-dd'),
      isCurrentMonth,
      dragStartDate: format(dragStartDate, 'yyyy-MM-dd'),
      selectedDates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
      pendingChanges: Object.keys(pendingChanges)
    });

    // Create range between dragStart and current
    const range = eachDayOfInterval({
      start: dragStartDate,
      end: date
    });

    const isAllCurrentMonth = range.every(d => 
      d.getMonth() === currentMonth.getMonth() && 
      d.getFullYear() === currentMonth.getFullYear()
    );

    console.log('Calendar: Creating range', {
      range: range.map(d => format(d, 'yyyy-MM-dd')),
      isAllCurrentMonth
    });

    if (isAllCurrentMonth) {
      onSelect(range);
    }
  }, [isDragging, dragStartDate, currentMonth, selectedDates, pendingChanges, onSelect]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    console.log('Calendar: Mouse up, ending drag', {
      dragStartDate: dragStartDate ? format(dragStartDate, 'yyyy-MM-dd') : null,
      selectedDates: selectedDates.map(d => format(d, 'yyyy-MM-dd'))
    });

    setIsDragging(false);
    setDragStartDate(null);
  }, [isDragging, dragStartDate, selectedDates]);

  const handleSelectAll = useCallback(() => {
    // Get only days in the current month
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const allDays = eachDayOfInterval({ start, end });

    // Check which days are currently selected in this month
    const selectedInCurrentMonth = selectedDates.filter(date => 
      date.getMonth() === currentMonth.getMonth() && 
      date.getFullYear() === currentMonth.getFullYear()
    );

    console.log('Calendar: Select all clicked', {
      currentMonth: format(currentMonth, 'yyyy-MM'),
      daysInMonth: allDays.map(d => format(d, 'yyyy-MM-dd')),
      currentlySelectedInMonth: selectedInCurrentMonth.map(d => format(d, 'yyyy-MM-dd')),
      allSelectedDates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
      pendingChanges: Object.entries(pendingChanges).map(([date, status]) => ({
        date,
        status: status.status,
        currentSong: status.currentSong?.title,
        newSong: status.newSong?.title
      }))
    });
    
    // If all days in current month are selected, unselect them
    const allSelected = allDays.every(day => 
      selectedDates.some(selected => isSameDay(selected, day))
    );

    if (allSelected) {
      console.log('Calendar: Unselecting all days in current month', {
        daysToUnselect: allDays.map(d => format(d, 'yyyy-MM-dd'))
      });
      // Keep selected dates that are not in the current month
      const datesOutsideMonth = selectedDates.filter(date => 
        date.getMonth() !== currentMonth.getMonth() || 
        date.getFullYear() !== currentMonth.getFullYear()
      );
      onSelect(datesOutsideMonth);
    } else {
      console.log('Calendar: Selecting all days in current month', {
        daysToSelect: allDays.map(d => format(d, 'yyyy-MM-dd'))
      });
      // Merge with existing selections outside current month
      const datesOutsideMonth = selectedDates.filter(date => 
        date.getMonth() !== currentMonth.getMonth() || 
        date.getFullYear() !== currentMonth.getFullYear()
      );
      onSelect([...datesOutsideMonth, ...allDays]);
    }
  }, [currentMonth, selectedDates, onSelect, pendingChanges]);

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
          <Button
            variant="secondary"
            onClick={handleSelectAll}
          >
            {getDaysInMonth(currentMonth).every(day => 
              selectedDates.some(selected => isSameDay(selected, day))
            ) ? 'Unselect All' : 'Select All'}
          </Button>
        </div>
      </div>

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