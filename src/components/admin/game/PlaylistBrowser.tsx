import React, { useState } from 'react';
import { List } from '@/components/ui/List';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePlaylists } from '@/hooks/use-playlists';
import { Playlist } from '@/types/admin';

interface PlaylistBrowserProps {
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlist: Playlist) => void;
  enabled?: boolean;
}

export function PlaylistBrowser({
  selectedPlaylistId,
  onSelectPlaylist,
  enabled = true
}: PlaylistBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: playlists, isLoading, error } = usePlaylists(searchQuery, enabled);

  if (!enabled) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search Header */}
      <div className="border-b border-primary/10 p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search playlists..."
          className="w-full bg-transparent font-mono px-2 py-1 text-sm border border-primary/10 focus:border-primary/30 outline-none"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            message="Failed to load playlists"
            icon="!"
            action={{
              label: 'Try again',
              onClick: () => window.location.reload()
            }}
          />
        ) : !playlists?.length ? (
          <EmptyState
            message={searchQuery ? 'No playlists found' : 'Type to search playlists'}
            icon={searchQuery ? '-' : '?'}
          />
        ) : (
          <List
            items={playlists}
            selectedId={selectedPlaylistId || undefined}
            onSelect={onSelectPlaylist}
            keyExtractor={(playlist) => playlist.id}
            renderItem={(playlist) => (
              <div className="flex flex-col gap-1">
                <span>{playlist.name}</span>
                <span className="text-sm opacity-50">
                  {playlist.trackCount} tracks
                </span>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
} 