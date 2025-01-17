import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { PlaylistBrowser } from './PlaylistBrowser';
import { SpotifyTrack } from '@/types/spotify';
import { AdminGame } from '@/types/admin';

interface BatchGameEditorProps {
  dates: Date[];
  onCancel: () => void;
  onComplete: () => void;
  onPreview: (games: AdminGame[]) => void;
}

interface GameProgress {
  date: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export function BatchGameEditor({ dates, onCancel, onComplete, onPreview }: BatchGameEditorProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<GameProgress[]>([]);
  const [previewTracks, setPreviewTracks] = useState<{ date: Date; track: SpotifyTrack }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaylistSelect = async (playlistId: string, playlistName: string) => {
    setIsLoading(true);
    setSelectedPlaylist({ id: playlistId, name: playlistName });
    
    try {
      const response = await fetch(`/api/admin/spotify/playlists/${playlistId}/tracks`);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      
      const tracks: SpotifyTrack[] = await response.json();
      const preview = dates.map(date => ({
        date,
        track: tracks[Math.floor(Math.random() * tracks.length)]
      }));
      
      setPreviewTracks(preview);
      
      // Convert preview to AdminGame format for calendar preview
      const previewAdminGames: AdminGame[] = preview.map(p => ({
        id: 'preview',
        date: format(p.date, 'yyyy-MM-dd'),
        songId: 'preview',
        song: {
          id: 'preview',
          spotifyId: p.track.id,
          title: p.track.title,
          artist: p.track.artist,
          previewUrl: '',
          lyrics: '',
          maskedLyrics: {
            title: [p.track.title],
            artist: [p.track.artist],
            lyrics: ['']
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      onPreview(previewAdminGames);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPlaylist || previewTracks.length === 0) return;

    setIsProcessing(true);
    const gameProgress = previewTracks.map(preview => ({
      date: format(preview.date, 'yyyy-MM-dd'),
      status: 'pending' as const
    }));
    setProgress(gameProgress);

    for (let i = 0; i < previewTracks.length; i++) {
      const { date, track } = previewTracks[i];
      setProgress(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'loading' } : p
      ));

      try {
        const response = await fetch('/api/admin/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(date, 'yyyy-MM-dd'),
            spotifyId: track.id,
            title: track.title,
            artist: track.artist
          })
        });

        if (!response.ok) throw new Error('Failed to create game');

        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'success' } : p
        ));
      } catch (error) {
        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error', error: 'Failed to create game' } : p
        ));
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    onComplete();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-mono mb-2">Batch Update</h2>
        <div className="text-sm text-muted">
          {dates.length} days selected
        </div>
      </div>

      {!selectedPlaylist ? (
        <PlaylistBrowser
          onSelect={handlePlaylistSelect}
          onCancel={onCancel}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-2 border border-foreground/10 rounded">
            <div>
              <div className="font-medium">{selectedPlaylist.name}</div>
              <div className="text-xs text-muted">Spotify ID: {selectedPlaylist.id}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted">Loading preview...</div>
          ) : (
            <div className="space-y-1">
              {previewTracks.map((preview, index) => (
                <div 
                  key={preview.date.toISOString()}
                  className="flex items-center justify-between py-1"
                >
                  <div className="text-sm text-muted">{index + 1}.</div>
                  <div className="text-sm ml-2 flex-1">
                    {format(preview.date, 'MMM d')} - {preview.track.title}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2 mt-4">
              {progress.map((p, i) => (
                <div 
                  key={p.date}
                  className="flex items-center justify-between"
                >
                  <div className="text-sm">{format(dates[i], 'MMM d')}</div>
                  <div className="flex items-center gap-2">
                    {p.status === 'pending' && <span className="text-sm">Pending</span>}
                    {p.status === 'loading' && <span className="text-sm text-primary">Creating...</span>}
                    {p.status === 'success' && <span className="text-sm text-green-500">Created</span>}
                    {p.status === 'error' && <span className="text-sm text-red-500">{p.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing || isLoading}
            >
              {isProcessing ? 'Creating Games...' : 'Create Games'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 