import React from 'react';
import type { GameState } from '@/lib/game/state';

interface StatsProps {
  gameState: GameState;
  guessCount: number;
  correctGuesses: number;
  averageGuessTime?: number; // in seconds
  leaderboard?: Array<{
    username: string;
    score: number;
    completionTime: number; // in seconds
  }>;
}

export function Stats({ 
  gameState, 
  guessCount, 
  correctGuesses,
  averageGuessTime,
  leaderboard = []
}: StatsProps) {
  const accuracy = guessCount > 0 ? (correctGuesses / guessCount) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Current Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <p className="text-sm text-gray-600">Total Guesses</p>
          <p className="text-2xl font-bold">{guessCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <p className="text-sm text-gray-600">Correct Guesses</p>
          <p className="text-2xl font-bold text-green-600">{correctGuesses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <p className="text-sm text-gray-600">Accuracy</p>
          <p className="text-2xl font-bold">{Math.round(accuracy)}%</p>
        </div>
        {averageGuessTime && (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-sm text-gray-600">Avg Time per Guess</p>
            <p className="text-2xl font-bold">{Math.round(averageGuessTime)}s</p>
          </div>
        )}
      </div>

      {/* Progress Breakdown */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-4">Progress Breakdown</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Title & Artist</span>
              <span className="text-sm font-medium">
                {Math.round(gameState.progress.titleArtist * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${gameState.progress.titleArtist * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Lyrics</span>
              <span className="text-sm font-medium">
                {Math.round(gameState.progress.lyrics * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${gameState.progress.lyrics * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.username} 
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {Math.floor(entry.completionTime / 60)}m {entry.completionTime % 60}s
                  </span>
                  <span className="font-bold">{entry.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 