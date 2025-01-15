'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  trackCount: number;
}

interface PlaylistBrowserProps {
  onSearch: (query: string) => Promise<Playlist[]>;
  onSelect: (playlistId: string) => void;
  selectedPlaylistId?: string;
  isLoading: boolean;
  error: Error | null;
}

const searchSchema = z.string().min(1).max(100);

export function PlaylistBrowser({
  onSearch,
  onSelect,
  selectedPlaylistId,
  isLoading,
  error
}: PlaylistBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debouncedSearch = useCallback(async (query: string) => {
    if (!query) {
      setPlaylists([]);
      return;
    }

    setSearchError(null);

    try {
      // Validate search query
      searchSchema.parse(query);
      const results = await onSearch(query);
      setPlaylists(results);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setSearchError('Please enter a valid search query (1-100 characters)');
      } else {
        setSearchError('Failed to search playlists. Please try again.');
      }
    }
  }, [onSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search playlists..."
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {searchError && (
        <p className="text-red-500">{searchError}</p>
      )}

      {error && (
        <p className="text-red-500">Error: {error.message}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onSelect(playlist.id)}
              className={`p-4 border rounded text-left transition-colors ${
                selectedPlaylistId === playlist.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {playlist.imageUrl && (
                  <img
                    src={playlist.imageUrl}
                    alt={playlist.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-600">{playlist.description}</p>
                  )}
                  <p className="text-sm text-gray-500">{playlist.trackCount} tracks</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 