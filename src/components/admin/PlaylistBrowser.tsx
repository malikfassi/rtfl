'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { GameResponse } from '@/lib/hooks/usePlaylist';

interface PlaylistBrowserProps {
  onSearch: (query: string) => Promise<void>;
  onSelect: (playlistId: string) => Promise<void>;
  selectedPlaylistId?: string;
  gameData: GameResponse | null;
  playlists: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export function PlaylistBrowser({
  onSearch,
  onSelect,
  selectedPlaylistId,
  gameData,
  playlists,
  isLoading = false,
}: PlaylistBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Update debounced value after delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Only trigger search when debounced query changes and is not empty
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery);
    } else {
      // Clear results when query is empty
      onSearch('');
    }
  }, [debouncedQuery, onSearch]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if value is empty or at least 3 characters
    if (!value || value.length >= 3) {
      setSearchQuery(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search playlists..."
          className="w-full p-2 border rounded-md"
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => onSelect(playlist.id)}
            className={`p-2 text-left rounded-md hover:bg-gray-100 ${
              selectedPlaylistId === playlist.id ? 'bg-blue-100' : ''
            }`}
          >
            {playlist.name} ({playlist.id})
          </button>
        ))}
      </div>

      {gameData && (
        <div className="space-y-2">
          <h3 className="font-bold">Selected Game</h3>
          <div>Date: {new Date(gameData.date).toLocaleDateString()}</div>
          <div>Playlist: {gameData.playlist.name}</div>
          <div>Random Seed: {gameData.randomSeed}</div>
          <div>Selected Track: {gameData.selectedTrack.name} by {gameData.selectedTrack.artists.join(', ')}</div>
          {gameData.selectedTrack.previewUrl && (
            <audio controls src={gameData.selectedTrack.previewUrl} className="w-full" />
          )}
        </div>
      )}
    </div>
  );
} 