'use client';

import { useEffect, useState } from 'react';

interface PlaylistSongBrowserProps {
  playlistId: string;
  onSelect: (songId: string) => Promise<void>;
  selectedSongId?: string;
  isLoading?: boolean;
}

interface PlaylistTrack {
  id: string;
  name: string;
  artists: string[];
}

export function PlaylistSongBrowser({
  playlistId,
  onSelect,
  selectedSongId,
  isLoading = false,
}: PlaylistSongBrowserProps) {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoadingTracks(true);
      setError(null);
      try {
        const response = await fetch(`/api/spotify/playlists/${playlistId}`, {
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        if (!response.ok) {
          throw new Error('Failed to fetch playlist tracks');
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setTracks(data.tracks || []);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tracks'));
        // If it's a timeout error and we haven't retried too many times, retry
        if (err instanceof Error && err.name === 'TimeoutError' && retryCount < 3) {
          setRetryCount(prev => prev + 1);
        }
      } finally {
        setIsLoadingTracks(false);
      }
    };

    fetchTracks();
  }, [playlistId, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{error.message}</span>
          <button
            onClick={handleRetry}
            disabled={isLoadingTracks}
            className="px-3 py-1 bg-red-200 hover:bg-red-300 rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      )}

      <div className="relative">
        <h3 className="text-lg font-semibold mb-4">Select Song from Playlist</h3>
        {(isLoading || isLoadingTracks) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onSelect(track.id)}
            className={`p-2 text-left rounded-md hover:bg-gray-100 ${
              selectedSongId === track.id ? 'bg-blue-100' : ''
            }`}
          >
            {track.name} - {track.artists.join(', ')}
          </button>
        ))}
      </div>
    </div>
  );
} 