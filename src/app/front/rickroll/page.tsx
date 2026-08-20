"use client";

import React, { useEffect, useState } from 'react';
import { LyricsGame } from '@/app/front/components/game/lyrics-game';
import { useGameState, useGuess } from '@/app/front/hooks/usePlayer';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import { ERROR_MESSAGES } from '@/app/front/lib/error-messages';

export default function RickrollPage() {
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  const { data: gameState } = useGameState(playerId, 'rickroll', !!playerId);
  const guessMutation = useGuess(playerId, 'rickroll');

  return (
    <div className="h-screen overflow-hidden bg-rtfl-bg text-rtfl-ink flex flex-col">
      <div className="shrink-0 flex items-baseline justify-center gap-3 pt-5 pb-1">
        <span className="text-[15px]">{ERROR_MESSAGES.RICKROLL_TITLE}</span>
        <span className="font-sans text-[13px] text-rtfl-ink-2">{ERROR_MESSAGES.RICKROLL_SUBTITLE}</span>
      </div>
      {/* No bespoke spinner: passing null lets the game render its own
          skeleton, so the layout doesn't jump when the song lands. */}
      <div className="flex-1 min-h-0">
        <LyricsGame
          date="rickroll"
          gameState={gameState ?? null}
          onGuess={(guess: string) => guessMutation.mutateAsync(guess)}
          playerId={playerId}
        />
      </div>
    </div>
  );
}
