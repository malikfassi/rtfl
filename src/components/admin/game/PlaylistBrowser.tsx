import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { SpotifyTrack } from '@/lib/clients/spotify';
import { PlaylistSongsList } from './PlaylistSongsList';

interface PlaylistBrowserProps {
  songAssignments: Record<string, Date[]>;
  onSelect: (tracks: SpotifyTrack[]) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export function PlaylistBrowser({ onSelect, onCancel: _onCancel, disabled = false, songAssignments }: PlaylistBrowserProps) {
  const [query, setQuery] = useState('');
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string; image?: string }>>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      if (!debouncedQuery) {
        setPlaylists([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/spotify/playlists?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error('Failed to fetch playlists:', error);
        setError('Failed to fetch playlists');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylists();
  }, [debouncedQuery]);

  const handleSelectPlaylist = async (playlist: { id: string; name: string }) => {
    try {
      setSelectedPlaylist(playlist);
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/spotify/playlists/${playlist.id}/tracks`);
      if (!response.ok) {
        throw new Error('Failed to fetch playlist tracks');
      }
      const data = await response.json();
      setTracks(data);
      // Automatically select all tracks when playlist is loaded
      await onSelect(data);
    } catch (error) {
      console.error('Failed to fetch playlist tracks:', error);
      setError('Failed to fetch playlist tracks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="space-y-2">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      {/* Playlist grid or track list */}
      {selectedPlaylist ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{selectedPlaylist.name}</h3>
            <button
              onClick={() => {
                setSelectedPlaylist(null);
                setTracks([]);
                // Restore focus to input when returning to playlist list
                inputRef.current?.focus();
              }}
              className="text-sm text-muted hover:text-foreground"
            >
              Back to playlists
            </button>
          </div>
          <PlaylistSongsList
            tracks={tracks}
            songAssignments={songAssignments}
            onSelect={() => {}} // No-op since we're handling all tracks at once
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleSelectPlaylist(playlist)}
              disabled={disabled || isLoading}
              className={cn(
                "p-4 text-left rounded-lg",
                "border border-foreground/10",
                "hover:bg-primary/5",
                "transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="font-medium">{playlist.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 