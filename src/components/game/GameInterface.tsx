import React, { useState } from 'react';

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
    <div className="p-4">
      <div className="player-id">
        Player {playerId}
      </div>

      <div className="flex items-center justify-between">
        <div className="current-game">
          Current Game
        </div>
        <button onClick={onClear} className="text-primary">
          Clear
        </button>
      </div>

      <div className="game-progress">
        {foundWords}/{totalWords} words found
      </div>

      <div className="game-status mb-4">
        <div className="flex gap-2">
          Title <span className="text-primary">✓</span>
        </div>
        <div className="flex gap-2">
          Artist <span className="text-primary">✓</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="game-input-container">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess..."
          className="game-input"
        />
        <button type="submit" className="game-button">
          Guess
        </button>
      </form>

      <div className="game-status">
        <div>Total Guesses: 6</div>
        <div>Missed: 1</div>
      </div>
    </div>
  );
} 