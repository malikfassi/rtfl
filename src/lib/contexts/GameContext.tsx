'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGameState } from '@/lib/hooks/useGameState';
import { useGameList } from '@/lib/hooks/useGameList';
import type { GameState } from '@/lib/game/state';
import type { Game } from '@prisma/client';

interface GameWithProgress extends Game {
  progress: {
    titleArtist: number;
    lyrics: number;
    overall: number;
  };
  isComplete: boolean;
}

interface GameContextValue {
  currentGame: {
    gameState: GameState | null;
    isLoading: boolean;
    error: Error | null;
    submitGuess: (guess: string) => Promise<void>;
    guessCount: number;
    correctGuesses: number;
    averageGuessTime: number | undefined;
  };
  gameList: {
    games: GameWithProgress[];
    isLoading: boolean;
    error: Error | null;
    refreshGames: () => Promise<void>;
    filterByDate: (start: Date, end: Date) => void;
  };
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  currentDate: string;
}

export function GameProvider({ children, currentDate }: GameProviderProps) {
  const currentGame = useGameState({ date: currentDate });
  const gameList = useGameList();

  const value: GameContextValue = {
    currentGame,
    gameList,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 