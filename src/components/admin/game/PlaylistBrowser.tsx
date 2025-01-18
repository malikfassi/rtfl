import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { SpotifyTrack } from '@/lib/clients/spotify';
import { PlaylistSongsList } from './PlaylistSongsList';

interface SpotifyPlaylist {
  id: string;
  name: string;
  image?: string;
}

interface PlaylistBrowserProps {
  onPlaylistSelect: (playlist: { tracks: SpotifyTrack[] }) => void;
}

export function PlaylistBrowser({ onPlaylistSelect }: PlaylistBrowserProps) {
  const [query, setQuery] = useState('');
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
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

  const handleSelectPlaylist = async (playlist: SpotifyPlaylist) => {
    try {
      setSelectedPlaylist(playlist);
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/spotify/playlists/${playlist.id}/tracks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      
      const tracks = await response.json();
      setTracks(tracks);
      onPlaylistSelect({ tracks });
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      setError('Failed to fetch tracks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setSelectedPlaylist(null);
            setTracks([]);
          }}
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      {!selectedPlaylist && !isLoading && (
        <div className="space-y-2">
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              onClick={() => handleSelectPlaylist(playlist)}
              className="w-full p-2 text-left hover:bg-accent rounded-md transition-colors"
            >
              {playlist.name}
            </button>
          ))}
        </div>
      )}

      {selectedPlaylist && (
        <>
          <h3 className="text-sm font-medium">{selectedPlaylist.name}</h3>
          <PlaylistSongsList
            tracks={tracks}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
} 