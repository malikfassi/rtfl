"use client";

import React, { useState } from 'react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface GameInterfaceProps {
  playerId: string;
  totalWords: number;
  foundWords: string[];
  _title: string;
  _artist: string;
  onGuess: (guess: string) => void;
  onClear: () => void;
}

export function GameInterface({
  playerId,
  totalWords,
  foundWords,
  _title,
  _artist,
  onGuess,
  onClear
}: GameInterfaceProps) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onGuess(guess.trim());
      setGuess('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Player Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Player ID: {playerId}
        </div>
        <Button onClick={onClear} variant="secondary" size="sm">
          Clear Progress
        </Button>
      </div>

      {/* Game Progress */}
      <div className="mb-8">
        <div className="text-lg font-semibold mb-2">Progress</div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(foundWords.length / totalWords) * 100}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {foundWords.length}/{totalWords}
          </div>
        </div>
      </div>

      {/* Song Info */}
      <div className="mb-8">
        <div className="text-lg font-semibold mb-4">Song</div>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500 mb-1">Title</div>
            <div className="font-mono">{_title}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500 mb-1">Artist</div>
            <div className="font-mono">{_artist}</div>
          </div>
        </div>
      </div>

      {/* Guess Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess..."
          className="w-full"
        />
        <Button type="submit" className="w-full">
          Submit Guess
        </Button>
      </form>

      {/* Found Words */}
      {foundWords.length > 0 && (
        <div className="mt-8">
          <div className="text-lg font-semibold mb-2">Found Words</div>
          <div className="flex flex-wrap gap-2">
            {foundWords.map((word, i) => (
              <div 
                key={i}
                className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 