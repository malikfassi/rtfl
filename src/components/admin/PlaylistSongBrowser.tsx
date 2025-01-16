'use client';

import { useEffect, useState } from 'react';
import { PlayerPreview } from './PlayerPreview';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
}

interface PlaylistSongBrowserProps {
  playlistId: string | null;
  onSongSelect: (trackId: string) => void;
  selectedTrackId?: string;
}

export function PlaylistSongBrowser({
  playlistId,
  onSongSelect,
  selectedTrackId,
}: PlaylistSongBrowserProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTrack, setPreviewTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!playlistId) {
      setTracks([]);
      return;
    }

    async function fetchTracks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/spotify/playlists/${playlistId}/tracks`);
        if (!response.ok) {
          throw new Error('Failed to fetch tracks');
        }
        const data = await response.json();
        setTracks(data.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTracks();
  }, [playlistId]);

  if (!playlistId) {
    return (
      <div className="p-4 text-gray-500 text-center">
        Select a playlist to view its tracks
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-blue-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold mb-4">Playlist Tracks</h2>
      <div className="space-y-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => onSongSelect(track.id)}
                className={`flex-1 text-left ${
                  selectedTrackId === track.id ? 'text-blue-600 font-medium' : ''
                }`}
              >
                <h3 className="font-medium">{track.name}</h3>
                <p className="text-sm text-gray-500">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </button>
              {track.preview_url && (
                <button
                  onClick={() => setPreviewTrack(track)}
                  className="ml-4 p-2 text-blue-500 hover:text-blue-600"
                >
                  Preview
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {previewTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
          <PlayerPreview
            song={{
              id: previewTrack.id,
              title: previewTrack.name,
              artist: previewTrack.artists.map((a) => a.name).join(', '),
              previewUrl: previewTrack.preview_url || '',
              maskedLyrics: {
                title: [],
                artist: [],
                lyrics: []
              }
            }}
          />
          <button
            onClick={() => setPreviewTrack(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
} 