import React from 'react';
import type { Game } from '@prisma/client';

interface GameStats {
  totalGames: number;
  activeGames: number;
  completedGames: number;
  averageCompletionRate: number;
  averageGuessCount: number;
  averageCompletionTime: number; // in seconds
}

interface PlayerMetrics {
  totalPlayers: number;
  activePlayers: number;
  topPlayers: Array<{
    username: string;
    gamesCompleted: number;
    averageScore: number;
    averageTime: number;
  }>;
}

interface AnalyticsProps {
  games: Game[];
  gameStats: GameStats;
  playerMetrics: PlayerMetrics;
  isLoading: boolean;
  error: Error | null;
  onTimeRangeChange: (range: 'day' | 'week' | 'month' | 'all') => void;
}

export function Analytics({
  games,
  gameStats,
  playerMetrics,
  isLoading,
  error,
  onTimeRangeChange,
}: AnalyticsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          {(['day', 'week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 first:rounded-l-md last:rounded-r-md"
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-6">Game Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Games Overview</h3>
            <div className="space-y-2">
              <p>Total Games: {gameStats.totalGames}</p>
              <p>Active Games: {gameStats.activeGames}</p>
              <p>Completed Games: {gameStats.completedGames}</p>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Completion Metrics</h3>
            <div className="space-y-2">
              <p>Completion Rate: {Math.round(gameStats.averageCompletionRate * 100)}%</p>
              <p>Avg. Guesses: {Math.round(gameStats.averageGuessCount)}</p>
              <p>Avg. Time: {Math.round(gameStats.averageCompletionTime / 60)}m</p>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Player Stats</h3>
            <div className="space-y-2">
              <p>Total Players: {playerMetrics.totalPlayers}</p>
              <p>Active Players: {playerMetrics.activePlayers}</p>
              <p>Player Retention: {Math.round((playerMetrics.activePlayers / playerMetrics.totalPlayers) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Players */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-6">Top Players</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Games Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {playerMetrics.topPlayers.map((player) => (
                <tr key={player.username}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{player.gamesCompleted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{Math.round(player.averageScore)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{Math.round(player.averageTime / 60)}m</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-6">Recent Games</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Playlist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Players
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {games.map((game) => (
                <tr key={game.date.toString()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{game.playlistId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {/* This would need to be added to the Game type */}
                      -
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {/* This would need to be added to the Game type */}
                      -
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 