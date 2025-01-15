import React from 'react';
import { GameBoard } from '@/components/game/GameBoard';
import { Stats } from '@/components/game/Stats';
import { GameProvider, useGame } from '@/lib/contexts/GameContext';

function GameContent() {
  const { currentGame } = useGame();
  const { 
    gameState, 
    isLoading, 
    error, 
    submitGuess,
    guessCount,
    correctGuesses,
    averageGuessTime,
    totalPlayTime,
  } = currentGame;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="text-center p-4">
        <p>No game available for today.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Game Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Guess the Song</h1>
        <p className="text-gray-600">
          Reveal the song by guessing words from its title, artist, and lyrics
        </p>
      </div>

      {/* Game Board */}
      <div className="mb-8">
        <GameBoard 
          gameState={gameState}
          onSubmitGuess={submitGuess}
          isLoading={isLoading}
        />
      </div>

      {/* Stats */}
      <div>
        <Stats 
          gameStats={{
            totalGuesses: guessCount,
            correctGuesses,
            averageGuessTime,
            totalPlayTime,
          }}
          topPlayers={[]}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default function GamePage() {
  // In a real app, you'd get this from the URL or state management
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <GameProvider currentDate={currentDate}>
      <GameContent />
    </GameProvider>
  );
} 