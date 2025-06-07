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
      <div>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a song..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading || disabled}
          autoFocus
        />
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-accent-error/10 text-accent-error text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-primary-muted py-8">
          <div className="animate-pulse">Searching...</div>
        </div>
      ) : tracks.length === 0 && debouncedQuery ? (
        <div className="text-center text-primary-muted py-8">
          No tracks found for &ldquo;{debouncedQuery}&rdquo;
        </div>
      ) : tracks.length > 0 ? (
        <div className="space-y-1 max-h-96 overflow-y-auto border border-primary-muted/20 rounded-lg">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              disabled={isLoading || disabled}
              className={cn(
                'w-full p-4 text-left transition-all duration-200',
                'hover:bg-primary-muted/10 focus:bg-primary-muted/15 focus:outline-none',
                'border-b border-primary-muted/10 last:border-b-0',
                'font-mono text-sm',
                selectedTrackId === track.id && 'bg-primary-muted/20',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-xs text-primary-muted w-8">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary-dark truncate">
                    {track.name}
                  </div>
                  <div className="text-primary-muted truncate">
                    {track.artists.map(artist => artist.name).join(', ')}
                  </div>
                </div>
                {selectedTrackId === track.id && (
                  <div className="text-accent-success text-xs">
                    ✓
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
} 