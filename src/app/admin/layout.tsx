'use client';

import { useState, useCallback } from 'react';
import { AdminDashboard } from '@/components/admin/game/AdminDashboard';
import { format } from 'date-fns';

interface Playlist {
  tracks: Array<{
    spotifyId: string;
    title: string;
    artist: string;
  }>;
}

export default function AdminLayout() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | undefined>();

  const handleGameUpdate = useCallback(async () => {
    try {
      const monthParam = format(new Date(), 'yyyy-MM');
      const response = await fetch(`/api/admin/games?month=${monthParam}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      await response.json();
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  }, []);

  return (
    <AdminDashboard 
      onGameUpdate={handleGameUpdate}
      selectedPlaylist={selectedPlaylist}
      onPlaylistChange={setSelectedPlaylist}
    />
  );
} 