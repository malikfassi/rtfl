"use client";

import React, { useEffect } from 'react';
import { LyricsGame } from '@/app/front/components/game/LyricsGame';
import { useRickrollGame } from '@/app/front/hooks/useRickrollGame';
import { ERROR_MESSAGES } from '@/app/front/lib/error-messages';

export default function RickrollPage() {
  const { rickrollGame, fetchRickrollGame, isLoading } = useRickrollGame();

  useEffect(() => {
    fetchRickrollGame();
  }, [fetchRickrollGame]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-mono">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-dark mb-4">{ERROR_MESSAGES.RICKROLL_TITLE}</h1>
            <p className="text-xl text-primary-muted">{ERROR_MESSAGES.RICKROLL_SUBTITLE}</p>
          </div>
          
          {rickrollGame && (
            <LyricsGame 
              date="rickroll" 
              game={undefined} 
            />
          )}
        </div>
      </div>
    </div>
  );
} 