import type { Track } from '@spotify/web-api-ts-sdk';
import React, { useEffect, useRef,useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import { Input } from '@/app/front/components/ui/Input';
import { useDebounce } from '@/app/front/hooks/useDebounce';
import { cn } from '@/app/front/lib/utils';

interface SongBrowserProps {
  onSelect: (track: Track) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function SongBrowser({ onSelect, onCancel, disabled }: SongBrowserProps) {
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
        setTracks(data.tracks);
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
      <div className="flex justify-between items-center gap-4">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a song..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading || disabled}
          autoFocus
          className="flex-1"
        />
        <Button variant="secondary" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
      </div>

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
              disabled={isLoading || disabled}
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