import React, { useState, useCallback } from 'react';
import { Calendar } from './Calendar';
import { GameEditor } from './GameEditor';
import { BatchGameEditor } from './BatchGameEditor';
import { isSameDay, format } from 'date-fns';
import { useGames } from '@/hooks/useGames';
import type { AdminGame, GameStatusInfo } from '@/types/admin';

interface AdminDashboardProps {
  onGameUpdate: () => Promise<void>;
}

type EditorMode = 'preview' | 'search';

export function AdminDashboard({ onGameUpdate }: AdminDashboardProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pendingChanges, setPendingChanges] = useState<Record<string, GameStatusInfo>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>('preview');
  const { games } = useGames(currentMonth);

  const handleDateSelect = useCallback((dates: Date[]) => {
    // Always update selection first
    setSelectedDates(dates);

    // Clear pending changes for dates that are no longer selected
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      Object.keys(newChanges).forEach(dateKey => {
        if (!dates.some(d => format(d, 'yyyy-MM-dd') === dateKey)) {
          delete newChanges[dateKey];
        }
      });
      return newChanges;
    });

    // Reset editor mode when switching to single selection
    if (dates.length <= 1) {
      setEditorMode('preview');
    }
  }, []);

  const handleGameUpdate = useCallback(async () => {
    if (selectedDates.length === 0) return;

    const dateKey = format(selectedDates[0], 'yyyy-MM-dd');
    try {
      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: { ...prev[dateKey], status: 'loading' }
      }));

      await onGameUpdate();

      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: { ...prev[dateKey], status: 'success' }
      }));

      setEditorMode('preview');
    } catch (error) {
      setPendingChanges(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to update game'
        }
      }));
    }
  }, [onGameUpdate, selectedDates]);

  const handleCompleteBatchEdit = useCallback(async () => {
    try {
      // Set all pending changes to loading
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        selectedDates.forEach(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (prev[dateKey]?.status !== 'success') {
            newChanges[dateKey] = { ...prev[dateKey], status: 'loading' };
          }
        });
        return newChanges;
      });

      await onGameUpdate();

      // Update all to success
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        selectedDates.forEach(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (prev[dateKey]?.status === 'loading') {
            newChanges[dateKey] = { ...prev[dateKey], status: 'success' };
          }
        });
        return newChanges;
      });
    } catch (error) {
      // Set error for all loading states
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        selectedDates.forEach(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (prev[dateKey]?.status === 'loading') {
            newChanges[dateKey] = {
              ...prev[dateKey],
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to update games'
            };
          }
        });
        return newChanges;
      });
    }
  }, [onGameUpdate, selectedDates]);

  const handlePendingChanges = useCallback((changes: Record<string, GameStatusInfo>) => {
    setPendingChanges(prev => ({
      ...prev,
      ...changes
    }));
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
              mode={editorMode}
              onModeChange={setEditorMode}
            />
          )
        )}
      </div>
    </div>
  );
} 