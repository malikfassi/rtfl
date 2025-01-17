import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { SpotifyPlaylist } from '@/lib/clients/spotify';
import debounce from 'lodash/debounce';

interface PlaylistBrowserProps {
  onSelect: (playlistId: string, playlistName: string) => void;
  onCancel: () => void;
}

export function PlaylistBrowser({ onSelect, onCancel }: PlaylistBrowserProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlaylists = async (query: string = '') => {
    if (!query.trim()) {
      setPlaylists([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/spotify/playlists?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch playlists');
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((query: string) => fetchPlaylists(query), 300),
    []
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
    return () => debouncedFetch.cancel();
  }, [searchQuery, debouncedFetch]);

  return (
    <div className="flex flex-col h-full p-8">
      <div className="mb-8">
        <h2 className="game-header">SELECT PLAYLIST</h2>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <input
        type="text"
        placeholder="Type to search playlists..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full mb-4 py-2 bg-transparent border-none outline-none placeholder:text-muted text-lg font-mono"
      />

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onSelect(playlist.id, playlist.name)}
              className="w-full p-4 text-left hover:bg-primary/5 transition-colors rounded-lg"
            >
              <div className="font-medium">{playlist.name}</div>
              <div className="text-sm text-muted">{playlist.trackCount} tracks</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 