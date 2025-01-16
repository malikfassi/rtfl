'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface Song {
  id: string;
  title: string;
  artist: string;
  previewUrl: string | null;
}

interface Game {
  id: string;
  date: string;
  songId: string;
  song: Song;
}

interface GameEditorProps {
  game?: Game;
  onSave: (gameData: Partial<Game>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function GameEditor({ game, onSave, onDelete }: GameEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongId, setSelectedSongId] = useState(game?.songId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        ...game,
        songId: selectedSongId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm('Are you sure you want to delete this game?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {game ? 'Edit Game' : 'Create Game'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Display */}
        {game && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="text-gray-900">
              {format(new Date(game.date), 'MMMM d, yyyy')}
            </div>
          </div>
        )}

        {/* Song Selection */}
        <div>
          <label
            htmlFor="songId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Song
          </label>
          <select
            id="songId"
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a song</option>
            {/* Song options will be populated from playlist */}
          </select>
        </div>

        {/* Preview Current Song */}
        {game?.song && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">{game.song.title}</h3>
            <p className="text-gray-500">{game.song.artist}</p>
            {game.song.previewUrl && (
              <audio
                controls
                className="mt-2 w-full"
                src={game.song.previewUrl}
              />
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg text-white
              ${isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
              }
            `}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className={`
                px-4 py-2 rounded-lg text-white
                ${isLoading
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
                }
              `}
            >
              {isLoading ? 'Deleting...' : 'Delete Game'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 