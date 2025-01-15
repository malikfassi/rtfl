'use client';

import { useEffect, useState } from 'react';
import type { GameState } from '@/lib/game/state';
import { GuessInput } from './GuessInput';

interface GameBoardProps {
  gameState: GameState | null;
  onSubmitGuess: (guess: string) => Promise<void>;
  isLoading?: boolean;
}

export function GameBoard({ gameState, onSubmitGuess, isLoading = false }: GameBoardProps) {
  const [showSpotify, setShowSpotify] = useState(false);

  // Show Spotify player when game is complete
  useEffect(() => {
    if (gameState?.isComplete) {
      setShowSpotify(true);
    }
  }, [gameState?.isComplete]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-500"
          style={{ width: `${gameState.progress.overall * 100}%` }}
        />
      </div>

      {/* Lyrics Section */}
      {gameState.maskedLyrics && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Lyrics</h2>
          <p className="whitespace-pre-wrap font-mono">
            {gameState.maskedLyrics.maskedText}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Progress: {Math.round(gameState.progress.lyrics * 100)}%
          </div>
        </section>
      )}

      {/* Title & Artist Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Song Details</h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Title</div>
            <div className="font-mono">{gameState.maskedTitle.maskedText}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Artist</div>
            <div className="font-mono">{gameState.maskedArtist.maskedText}</div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Progress: {Math.round(gameState.progress.titleArtist * 100)}%
        </div>
      </section>

      {/* Spotify Preview */}
      {showSpotify && gameState.spotify && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Song Preview</h2>
          {gameState.spotify.previewUrl ? (
            <audio
              controls
              src={gameState.spotify.previewUrl}
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p className="text-gray-500">No preview available</p>
          )}
          {gameState.spotify.albumCover && (
            <img
              src={gameState.spotify.albumCover}
              alt="Album Cover"
              className="mt-4 w-32 h-32 object-cover rounded-lg"
            />
          )}
        </section>
      )}

      {/* Guess Input */}
      <GuessInput
        onSubmit={onSubmitGuess}
        disabled={isLoading || gameState.isComplete}
      />
    </div>
  );
} 