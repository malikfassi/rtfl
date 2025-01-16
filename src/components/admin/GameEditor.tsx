import React, { useState } from 'react';
import { useGame } from '@/hooks/use-game';
import { useGameMutations } from '@/hooks/use-game-mutations';
import { GameHeader } from './game/GameHeader';
import { PlaylistBrowser } from './game/PlaylistBrowser';
import { PlaylistSongBrowser } from './game/PlaylistSongBrowser';
import { GamePreview } from './game/GamePreview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpotifyTrack, Playlist } from '@/types/admin';

interface GameEditorProps {
  date: string;
}

export function GameEditor({ date }: GameEditorProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const { data: game, isLoading: isLoadingGame, error: gameError } = useGame(date);
  const { createOrUpdateGame, deleteGame, isLoading: isMutating } = useGameMutations(date);

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylistId(playlist.id);
  };

  const handleSelectSong = async (track: SpotifyTrack) => {
    try {
      await createOrUpdateGame(track.id);
    } catch (error) {
      console.error('Failed to create/update game:', error);
    }
  };

  const handleDeleteGame = async () => {
    try {
      await deleteGame();
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  if (isLoadingGame) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (gameError) {
    return (
      <EmptyState
        message="Failed to load game"
        icon="!"
        action={{
          label: 'Try again',
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel: Game Header + Playlist Browser */}
      <div className="flex w-80 flex-col border-r border-primary/10">
        <GameHeader
          date={date}
          onDelete={handleDeleteGame}
          isDeleting={isMutating}
        />
        <PlaylistBrowser
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
        />
      </div>

      {/* Middle Panel: Song Browser */}
      <div className="flex w-96 flex-col border-r border-primary/10">
        <PlaylistSongBrowser
          playlistId={selectedPlaylistId}
          onSelectSong={handleSelectSong}
        />
      </div>

      {/* Right Panel: Game Preview */}
      <div className="flex-1">
        {game ? (
          <GamePreview game={game} />
        ) : (
          <EmptyState
            message="Select a song to create a game"
            icon="+"
          />
        )}
      </div>
    </div>
  );
} 