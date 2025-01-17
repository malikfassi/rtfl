import React, { useState, useCallback } from 'react';
import { Calendar } from './Calendar';
import { GameEditor } from './GameEditor';
import { BatchGameEditor } from './BatchGameEditor';
import { isSameDay } from 'date-fns';
import { useGames } from '@/hooks/useGames';
import type { AdminGame, GameStatusInfo } from '@/types/admin';

interface AdminDashboardProps {
  onGameUpdate: () => Promise<void>;
}

export function AdminDashboard({ onGameUpdate }: AdminDashboardProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pendingChanges, setPendingChanges] = useState<Record<string, GameStatusInfo>>({});
  const { games } = useGames(currentMonth);

  const handleDateSelect = useCallback((dates: Date[]) => {
    setSelectedDates(dates);
  }, []);

  const handleGameUpdate = useCallback(async () => {
    await onGameUpdate();
    setPendingChanges({});
  }, [onGameUpdate]);

  const handleCompleteBatchEdit = useCallback(async () => {
    await onGameUpdate();
    const currentPendingChanges = { ...pendingChanges };
    const hasSuccessOrError = Object.values(currentPendingChanges).every(
      change => change.status === 'success' || change.status === 'error'
    );
    
    if (hasSuccessOrError) {
      setTimeout(() => {
        setSelectedDates([]);
        setPendingChanges({});
      }, 2000);
    }
  }, [onGameUpdate, pendingChanges]);

  const handlePendingChanges = useCallback((changes: Record<string, GameStatusInfo>) => {
    setPendingChanges(changes);
  }, []);

  return (
    <div className="h-full grid grid-cols-[1fr,400px] gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-mono mb-4">Game Editor</h1>

        <Calendar
          selectedDates={selectedDates}
          onSelect={handleDateSelect}
          games={games}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          pendingChanges={pendingChanges}
        />
      </div>

      <div className="border-l border-foreground/10">
        {selectedDates.length > 0 && (
          selectedDates.length > 1 ? (
            <BatchGameEditor
              selectedDates={selectedDates}
              onComplete={handleCompleteBatchEdit}
              onPendingChanges={handlePendingChanges}
              games={games}
            />
          ) : (
            <GameEditor
              selectedDate={selectedDates[0]}
              game={games.find((g: AdminGame) => isSameDay(new Date(g.date), selectedDates[0]))}
              onGameUpdate={handleGameUpdate}
            />
          )
        )}
      </div>
    </div>
  );
} 