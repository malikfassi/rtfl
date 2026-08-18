"use client";

import React, { useState, useEffect } from 'react';
import { LyricsGame } from './LyricsGame';
import { useGameLogic } from '@/app/front/hooks/useGameLogic';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import type { GameLogicProps } from '@/app/types';

interface LyricsGameWrapperProps {
  date: string;
}

export function LyricsGameWrapper({ date }: LyricsGameWrapperProps) {
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  
  const gameLogic = useGameLogic({ date } as GameLogicProps);
  
  const {
    currentGame,
    isGameLoading,
    gameError,
    handleGuess,
  } = gameLogic;

  // Get player ID on client side
  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  // Show loading state - but only on client side to avoid hydration mismatch
  if (isGameLoading && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen bg-background font-mono">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading game...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (gameError) {
    return (
      <div className="min-h-screen bg-background font-mono">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
              <p className="text-red-500">{gameError.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show game
  if (!currentGame) {
    // During SSR or when no game data, show a minimal loading state
    return (
      <div className="min-h-screen bg-background font-mono">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading game...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LyricsGame
      gameState={currentGame}
      onGuess={handleGuess}
      onShowFullLyrics={() => setShowFullLyrics(true)}
      date={date}
      playerId={playerId}
    />
  );
} 