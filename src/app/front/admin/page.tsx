'use client';

import type { Track } from '@spotify/web-api-ts-sdk';
import React, { useState } from 'react';

import { AdminDashboard } from '@/app/front/components/admin/game/AdminDashboard';
import { useAdminGames, useAdminGameMutations } from '@/app/front/hooks/useAdmin';

interface Playlist {
  tracks: Track[];
}

export default function AdminPage() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>();
  const { data: games, isLoading } = useAdminGames();
  const { createGame, deleteGame } = useAdminGameMutations();

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <AdminDashboard 
        games={games || []}
        onCreateGame={createGame.mutate}
        onDeleteGame={deleteGame.mutate}
        selectedPlaylist={selectedPlaylist ?? undefined}
        onPlaylistChange={setSelectedPlaylist}
      />
    </div>
  );
} 