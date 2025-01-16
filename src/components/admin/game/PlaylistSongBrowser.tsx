import React, { useState } from 'react';
import { List } from '@/components/ui/List';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { usePlaylistTracks } from '@/hooks/use-playlists';
import { SpotifyTrack } from '@/types/admin';

interface PlaylistSongBrowserProps {
  playlistId: string | null;
  onSelectSong: (track: SpotifyTrack) => void;
}

export function PlaylistSongBrowser({
  playlistId,
  onSelectSong
}: PlaylistSongBrowserProps) {
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const { data: tracks, isLoading, error } = usePlaylistTracks(playlistId);

  const handlePreview = (track: SpotifyTrack) => {
    if (previewingTrackId === track.id) {
      setPreviewingTrackId(null);
    } else {
      setPreviewingTrackId(track.id);
    }
  };

  if (!playlistId) {
    return (
      <EmptyState
        message="Select a playlist to view songs"
        icon="?"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load songs"
        icon="!"
        action={{
          label: 'Try again',
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  if (!tracks?.length) {
    return (
      <EmptyState
        message="No songs found in this playlist"
        icon="-"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-primary/10 px-6 py-4">
        <h2 className="font-mono">
          <span className="opacity-50">{'>'} </span>
          Songs
        </h2>
      </div>
      <List
        items={tracks}
        keyExtractor={(track) => track.id}
        renderItem={(track) => (
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span>{track.name}</span>
              <span className="text-sm opacity-50">
                {track.artists.map(a => a.name).join(', ')}
              </span>
            </div>
            <div className="flex gap-2">
              {track.preview_url && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(track);
                  }}
                  prefix={previewingTrackId === track.id ? '[]' : '▶'}
                >
                  {previewingTrackId === track.id ? 'Stop' : 'Preview'}
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSong(track);
                }}
              >
                Select
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
} 