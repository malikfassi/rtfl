'use client';

import React, { useState } from 'react';
import type { Game } from '@prisma/client';

interface GameManagerProps {
  onCreateGame: (date: string, playlistId: string) => Promise<void>;
  onRefreshSeed: (date: string) => Promise<void>;
  onDeleteGame: (date: string) => Promise<void>;
  games: Game[];
  isLoading: boolean;
  error: Error | null;
}

export function GameManager({
  onCreateGame,
  onRefreshSeed,
  onDeleteGame,
  games,
  isLoading,
  error
}: GameManagerProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedDate || !playlistId) {
      setFormError('Please select a date and enter a playlist ID');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateGame(selectedDate, playlistId);
      // Reset form
      setSelectedDate('');
      setPlaylistId('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Create Game Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Create New Game</h2>
        <form onSubmit={handleCreateGame} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="playlistId" className="block text-sm font-medium text-gray-700">
              Playlist ID
            </label>
            <input
              type="text"
              id="playlistId"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Spotify playlist ID"
              required
            />
          </div>
          {(error || formError) && (
            <div className="text-red-600 text-sm">
              {error?.message || formError}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !selectedDate || !playlistId}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Game'}
          </button>
        </form>
      </div>

      {/* Games List */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Manage Games</h2>
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.date.toString()}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{new Date(game.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">Playlist: {game.playlistId}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRefreshSeed(game.date.toString())}
                  className="py-1 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Refresh Seed
                </button>
                <button
                  onClick={() => onDeleteGame(game.date.toString())}
                  className="py-1 px-3 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {games.length === 0 && (
            <p className="text-center text-gray-500 py-4">No games available</p>
          )}
        </div>
      </div>
    </div>
  );
} 