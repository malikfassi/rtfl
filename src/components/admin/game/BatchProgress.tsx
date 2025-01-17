import React from 'react';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AdminGame } from '@/types/admin';
import { BatchGameError } from '@/hooks/use-batch-games';

interface BatchProgressProps {
  total: number;
  current: number;
  results: AdminGame[];
  errors: BatchGameError[];
  currentDate?: Date;
}

export function BatchProgress({
  total,
  current,
  results,
  errors,
  currentDate
}: BatchProgressProps) {
  const progress = Math.round((current / total) * 100);
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          {current} / {total} games created
        </div>
        <div className="text-sm text-muted">
          {progress}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            hasErrors ? 'bg-red-500' : 'bg-foreground/50'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current Operation */}
      {currentDate && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <LoadingSpinner size="sm" />
          <span>{format(currentDate, 'MM.dd.yyyy')}</span>
        </div>
      )}

      {/* Results */}
      <div className="space-y-1">
        {results.slice(-3).map(game => (
          <div 
            key={game.id}
            className="flex items-center gap-2 text-sm text-muted"
          >
            <span>→</span>
            <span>{format(new Date(game.date), 'MM.dd.yyyy')}</span>
            <span>{game.song.title}</span>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-1">
          <div className="text-sm text-red-500">Failed to create {errors.length} games:</div>
          {errors.map(({ date, error }, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-sm text-red-500"
            >
              <span>×</span>
              <span>{format(date, 'MM.dd.yyyy')}</span>
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 