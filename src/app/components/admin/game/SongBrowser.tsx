import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { Track } from '@spotify/web-api-ts-sdk';

interface SongBrowserProps {
  onSelect: (track: Track) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export function SongBrowser({ onSelect, onCancel: _onCancel, disabled = false }: SongBrowserProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function searchTracks() {
      if (!debouncedQuery) {
        setTracks([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/spotify/tracks/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to search tracks');
        }
        const data = await response.json();
        setTracks(data);
      } catch (error) {
        console.error('Failed to search tracks:', error);
        setError(error instanceof Error ? error.message : 'Failed to search tracks');
      } finally {
        setIsLoading(false);
      }
    }

    searchTracks();
  }, [debouncedQuery]);

  const handleSelectTrack = async (track: Track) => {
    try {
      setSelectedTrackId(track.id);
      await onSelect(track);
    } catch (error) {
      console.error('Failed to select track:', error);
      setError('Failed to select track');
      setSelectedTrackId(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled || isLoading}
        autoFocus
      />

      {error && <div className="text-red-500">{error}</div>}

      {isLoading ? (
        <div className="text-center text-muted">Searching...</div>
      ) : tracks.length === 0 && debouncedQuery ? (
        <div className="text-center text-muted">No tracks found</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              disabled={disabled || isLoading}
              className={cn(
                'w-full p-2 text-left hover:bg-gray-100 rounded',
                selectedTrackId === track.id && 'bg-gray-100'
              )}
            >
              <div className="font-medium">{track.name}</div>
              <div className="text-sm text-muted">
                {track.artists.map(artist => artist.name).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 