'use client';

import type { Track } from '@spotify/web-api-ts-sdk';
import { format } from 'date-fns';
import React from 'react';
import { useCallback,useState } from 'react';

import { AdminDashboard } from '@/app/front/components/admin/game/AdminDashboard';

interface Playlist {
  tracks: Track[];
}

export default function AdminPage() {
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <AdminDashboard 
        onGameUpdate={handleGameUpdate}
        selectedPlaylist={selectedPlaylist}
        onPlaylistChange={setSelectedPlaylist}
      />
    </div>
  );
} 