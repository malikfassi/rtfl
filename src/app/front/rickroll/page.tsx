"use client";

import React, { useEffect } from 'react';
import { LyricsGame } from '@/app/front/components/game/lyrics-game';
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
              gameState={{
                ...rickrollGame,
                guesses: rickrollGame.guesses.map(g => ({
                  ...g,
                  gameId: rickrollGame.id,
                  playerId: 'rickroll-player',
                  createdAt: new Date(),
                })),
                masked: {
                  title: Array.isArray(rickrollGame.masked.title)
                    ? rickrollGame.masked.title
                    : (typeof rickrollGame.masked.title === 'string'
                        ? rickrollGame.masked.title.split(' ').map(word => ({ value: word, isToGuess: false }))
                        : []),
                  artist: Array.isArray(rickrollGame.masked.artist)
                    ? rickrollGame.masked.artist
                    : (typeof rickrollGame.masked.artist === 'string'
                        ? rickrollGame.masked.artist.split(' ').map(word => ({ value: word, isToGuess: false }))
                        : []),
                  lyrics: Array.isArray(rickrollGame.masked.lyrics)
                    ? rickrollGame.masked.lyrics
                    : (typeof rickrollGame.masked.lyrics === 'string'
                        ? rickrollGame.masked.lyrics.split(' ').map(word => ({ value: word, isToGuess: false }))
                        : []),
                },
                song: {
                  title: rickrollGame.song.spotifyData.title,
                  artist: rickrollGame.song.spotifyData.artist,
                  lyrics: '', // No lyrics in rickrollGame.song, so leave empty or fetch if available
                },
              }}
              onGuess={async () => {}}
              onShowFullLyrics={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
} 