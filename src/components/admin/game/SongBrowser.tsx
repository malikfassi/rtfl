import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { SpotifyTrack } from '@/types/spotify';

interface SongBrowserProps {
  onSelect: (track: SpotifyTrack) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export function SongBrowser({ onSelect, onCancel: _onCancel, disabled = false }: SongBrowserProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

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
          throw new Error('Failed to search tracks');
        }
        const data = await response.json();
        setTracks(data);
      } catch (error) {
        console.error('Failed to search tracks:', error);
        setError('Failed to search tracks');
      } finally {
        setIsLoading(false);
      }
    }

    searchTracks();
  }, [debouncedQuery]);

  const handleSelectTrack = async (track: SpotifyTrack) => {
    setSelectedTrackId(track.id);
    await onSelect(track);
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="space-y-2">
        <Input
          type="search"
          placeholder="Search songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled || isLoading}
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      {/* Track list */}
      <div className="space-y-2">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => handleSelectTrack(track)}
            disabled={disabled || isLoading}
            className={cn(
              "w-full flex items-center gap-4 p-3 text-left",
              "border border-foreground/10 rounded-lg",
              "hover:bg-primary/5",
              "transition-colors",
              selectedTrackId === track.id && "border-primary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {track.imageUrl && (
              <img 
                src={track.imageUrl} 
                alt={track.title} 
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div>
              <div className="font-medium">{track.title}</div>
              <div className="text-sm text-muted">{track.artist}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 