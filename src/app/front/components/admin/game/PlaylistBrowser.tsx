import type { SimplifiedPlaylist,Track } from '@spotify/web-api-ts-sdk';
import React, { useEffect, useRef,useState } from 'react';

import { Input } from '@/app/front/components/ui/Input';
import { useDebounce } from '@/app/front/hooks/useDebounce';
import { usePlaylists, usePlaylistTracks } from '@/app/front/hooks/use-playlists';

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
  const [selectedPlaylist, setSelectedPlaylist] = useState<SimplifiedPlaylist | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: playlists = [], isLoading: isLoadingPlaylists, error: playlistError } = usePlaylists(debouncedQuery);
  const { data: tracks = [], isLoading: isLoadingTracks } = usePlaylistTracks(selectedPlaylist?.id ?? null);

  const handleSelectPlaylist = async (playlist: SimplifiedPlaylist) => {
    setSelectedPlaylist(playlist);
  };

  useEffect(() => {
    if (tracks.length > 0) {
      onPlaylistSelect({ tracks });
    }
  }, [tracks, onPlaylistSelect]);

  const renderContent = () => {
    if (isLoadingPlaylists) {
      return <LoadingState />;
    }
    if (selectedPlaylist) {
      return (
        <SelectedPlaylistView 
          playlist={selectedPlaylist} 
          tracks={tracks} 
          isLoading={isLoadingTracks} 
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
          }}
        />
        {playlistError && <div className="text-sm text-destructive">{playlistError instanceof Error ? playlistError.message : 'Failed to fetch playlists'}</div>}
      </div>
      {renderContent()}
    </div>
  );
} 