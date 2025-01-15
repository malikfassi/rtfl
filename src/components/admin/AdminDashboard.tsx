'use client';

import { useState } from 'react';
import { AdminProvider, useAdmin } from '@/lib/contexts/AdminContext';
import { GameCalendar } from './GameCalendar';
import { GameEditor } from './GameEditor';
import { Analytics } from './Analytics';

function AdminContent() {
  const { games, analytics } = useAdmin();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const selectedGame = selectedDate
    ? games.list.find(game => {
        const gameDate = new Date(game.date);
        return (
          gameDate.getFullYear() === selectedDate.getFullYear() &&
          gameDate.getMonth() === selectedDate.getMonth() &&
          gameDate.getDate() === selectedDate.getDate()
        );
      }) ?? null
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <GameCalendar
            games={games.list}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            isLoading={games.isLoading}
          />
          
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
            <Analytics
              games={games.list}
              gameStats={analytics.gameStats}
              playerMetrics={analytics.playerMetrics}
              isLoading={analytics.isLoading}
              error={analytics.error}
              onTimeRangeChange={analytics.setTimeRange}
            />
          </section>
        </div>

        {selectedDate && (
          <GameEditor
            date={selectedDate}
            game={selectedGame}
            onSave={games.createGame}
            onDelete={games.deleteGame}
            onRefreshSeed={games.refreshSeed}
            isLoading={games.isLoading}
          />
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
} 