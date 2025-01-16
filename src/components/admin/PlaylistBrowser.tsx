'use client';

import { useEffect, useState } from 'react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[];
}

interface PlaylistBrowserProps {
  onPlaylistSelect: (playlistId: string) => void;
}

export function PlaylistBrowser({ onPlaylistSelect }: PlaylistBrowserProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const response = await fetch('/api/admin/spotify/playlists');
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        setPlaylists(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylists();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
      <h2 className="text-xl font-semibold mb-4">Your Playlists</h2>
      {playlists.map((playlist) => (
        <button
          key={playlist.id}
          onClick={() => onPlaylistSelect(playlist.id)}
          className="w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center space-x-4 text-left"
        >
          {playlist.images[0] && (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div>
            <h3 className="font-medium text-gray-900">{playlist.name}</h3>
            {playlist.description && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {playlist.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
} 