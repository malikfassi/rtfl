"use client";

import React, { useEffect, useState } from 'react';
import { LyricsGame } from '@/app/front/components/game/lyrics-game';
import { LoadingState } from '@/app/front/components/ui/LoadingState';
import { useGameState, useGuess } from '@/app/front/hooks/usePlayer';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import { ERROR_MESSAGES } from '@/app/front/lib/error-messages';

export default function RickrollPage() {
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  const { data: gameState, isLoading } = useGameState(playerId, 'rickroll', !!playerId);
  const guessMutation = useGuess(playerId, 'rickroll');

  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen bg-background font-mono flex items-center justify-center">
        <LoadingState message="Loading your rickroll..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="text-center pt-8">
        <h1 className="text-4xl font-bold text-primary-dark mb-4">{ERROR_MESSAGES.RICKROLL_TITLE}</h1>
        <p className="text-xl text-primary-muted">{ERROR_MESSAGES.RICKROLL_SUBTITLE}</p>
      </div>

      <LyricsGame
        date="rickroll"
        gameState={gameState}
        onGuess={(guess: string) => guessMutation.mutateAsync(guess)}
        onShowFullLyrics={() => {}}
        playerId={playerId}
      />
    </div>
  );
}
