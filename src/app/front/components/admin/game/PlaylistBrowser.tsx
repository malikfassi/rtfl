import type { SimplifiedPlaylist,Track } from '@spotify/web-api-ts-sdk';
import React, { useEffect, useRef,useState } from 'react';

import { Input } from '@/app/front/components/ui/Input';
import { useDebounce } from '@/app/front/hooks/useDebounce';

import { PlaylistSongsList } from './PlaylistSongsList';

interface PlaylistBrowserProps {
  onPlaylistSelect: (playlist: { tracks: Track[] }) => void;
}

function LoadingState() {
  return <div>Loading...</div>;
}

function SelectedPlaylistView({ playlist, tracks, isLoading }: { 
  playlist: SimplifiedPlaylist; 
  tracks: Track[]; 
  isLoading: boolean; 
}) {
  return (
    <div>
      <h3 className="text-sm font-medium">{playlist.name}</h3>
      <PlaylistSongsList
        tracks={tracks}
        isLoading={isLoading}
      />
    </div>
  );
}

function PlaylistList({ playlists, onSelect }: { 
  playlists: SimplifiedPlaylist[]; 
  onSelect: (playlist: SimplifiedPlaylist) => void; 
}) {
  // Filter out any invalid playlists
  const validPlaylists = playlists.filter(playlist => playlist && playlist.id && playlist.name);

  if (!validPlaylists.length) {
    return <div className="text-sm text-muted">No playlists found</div>;
  }

  return (
    <ul className="space-y-2">
      {validPlaylists.map((playlist, index) => (
        <li key={`${playlist.id}-${index}`}>
          <button
            onClick={() => onSelect(playlist)}
            className="w-full p-2 text-left hover:bg-accent rounded-md transition-colors"
          >
            {playlist.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PlaylistBrowser({ onPlaylistSelect }: PlaylistBrowserProps) {
  const [query, setQuery] = useState('');
  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SimplifiedPlaylist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
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

  const handleSelectPlaylist = async (playlist: SimplifiedPlaylist) => {
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

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (selectedPlaylist) {
      return (
        <SelectedPlaylistView 
          playlist={selectedPlaylist} 
          tracks={tracks} 
          isLoading={isLoading} 
        />
      );
    }
    return (
      <PlaylistList 
        playlists={playlists} 
        onSelect={handleSelectPlaylist} 
      />
    );
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
      {renderContent()}
    </div>
  );
} 