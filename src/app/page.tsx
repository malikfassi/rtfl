"use client";

import { GameInterface } from '@/components/game/GameInterface';

export default function PlayerPage() {
  // TODO: These will come from hooks later
  const mockData = {
    playerId: 'player123',
    totalWords: 20,
    foundWords: ['test', 'words'],
    _title: 'Masked Title',
    _artist: 'Masked Artist',
  };

  const handleGuess = (guess: string) => {
    console.log('Guessed:', guess);
  };

  const handleClear = () => {
    console.log('Clear game');
  };

  return (
    <main className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-8 text-center">
        Guess the Song
      </h1>
      
      <GameInterface
        playerId={mockData.playerId}
        totalWords={mockData.totalWords}
        foundWords={mockData.foundWords}
        _title={mockData._title}
        _artist={mockData._artist}
        onGuess={handleGuess}
        onClear={handleClear}
      />
    </main>
  );
} 