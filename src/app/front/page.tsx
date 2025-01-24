"use client";

import { useMutation,useQuery } from '@tanstack/react-query';
import React from 'react';

import { GameInterface } from '@/app/front/components/admin/GameInterface';

export default function PlayerPage() {
  const { data: gameState, isLoading } = useQuery({
    queryKey: ['game'],
    queryFn: async () => {
      const response = await fetch('/api/game');
      if (!response.ok) throw new Error('Failed to fetch game state');
      return response.json();
    },
  });

  const guessMutation = useMutation({
    mutationFn: async (guess: string) => {
      const response = await fetch('/api/game/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess }),
      });
      if (!response.ok) throw new Error('Failed to submit guess');
      return response.json();
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/game/clear', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear game');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-2xl p-4">
        <div className="flex justify-center items-center min-h-[50vh]">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-8 text-center">
        Guess the Song
      </h1>
      
      <GameInterface
        playerId={gameState.playerId}
        totalWords={gameState.totalWords}
        foundWords={gameState.foundWords}
        _title={gameState._title}
        _artist={gameState._artist}
        onGuess={(guess: string) => guessMutation.mutate(guess)}
        onClear={() => clearMutation.mutate()}
      />
    </main>
  );
} 