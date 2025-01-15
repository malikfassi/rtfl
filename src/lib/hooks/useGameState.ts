'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GameState } from '@/lib/game/state';

interface GameGuessResponse {
  id: string;
  userId: string;
  gameId: string;
  word: string;
  timestamp: string;
  wasCorrect: boolean;
}

interface UseGameStateProps {
  date: string;
  /** Optional custom win condition configuration */
  winConditions?: {
    minLyricsProgress: number;
    requireBothTitleAndArtist: boolean;
  };
}

interface UseGameStateReturn {
  gameState: GameState | null;
  isLoading: boolean;
  error: Error | null;
  submitGuess: (guess: string) => Promise<void>;
  guessCount: number;
  correctGuesses: number;
  averageGuessTime: number | undefined;
  /** Time since first guess in seconds */
  totalPlayTime: number | undefined;
  /** Reset game state */
  reset: () => void;
}

export function useGameState({ date, winConditions }: UseGameStateProps): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [guessCount, setGuessCount] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [guessTimes, setGuessTimes] = useState<number[]>([]);
  const [firstGuessTime, setFirstGuessTime] = useState<number | null>(null);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/games/${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }
      const data = await response.json();
      setGameState(data);
      
      // Initialize stats from existing guesses
      if (data.guesses) {
        setGuessCount(data.guesses.length);
        setCorrectGuesses(data.guesses.filter((g: GameGuessResponse) => g.wasCorrect).length);
        
        // Calculate guess times from timestamps
        const times = data.guesses.map((g: GameGuessResponse) => new Date(g.timestamp).getTime());
        if (times.length > 0) {
          setFirstGuessTime(times[0]);
          const guessDurations = times.slice(1).map((t: number, i: number) => (t - times[i]) / 1000);
          setGuessTimes(guessDurations);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  // Submit a guess
  const submitGuess = useCallback(async (guess: string) => {
    if (!gameState) return;

    const startTime = Date.now();
    if (!firstGuessTime) {
      setFirstGuessTime(startTime);
    }

    try {
      const response = await fetch(`/api/games/${date}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          word: guess,
          ...(winConditions && { winConditions }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit guess');
      }

      const data = await response.json();
      setGameState(data);
      setGuessCount((prev) => prev + 1);

      // Update stats
      const endTime = Date.now();
      const guessTime = (endTime - startTime) / 1000; // Convert to seconds
      setGuessTimes((prev) => [...prev, guessTime]);

      if (data.guess.isCorrect) {
        setCorrectGuesses((prev) => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, [date, gameState, firstGuessTime, winConditions]);

  // Calculate average guess time
  const averageGuessTime = guessTimes.length > 0
    ? guessTimes.reduce((a, b) => a + b, 0) / guessTimes.length
    : undefined;

  // Calculate total play time
  const totalPlayTime = firstGuessTime
    ? (Date.now() - firstGuessTime) / 1000
    : undefined;

  // Reset game state
  const reset = useCallback(() => {
    setGameState(null);
    setGuessCount(0);
    setCorrectGuesses(0);
    setGuessTimes([]);
    setFirstGuessTime(null);
    setError(null);
    fetchGameState();
  }, [fetchGameState]);

  return {
    gameState,
    isLoading,
    error,
    submitGuess,
    guessCount,
    correctGuesses,
    averageGuessTime,
    totalPlayTime,
    reset,
  };
} 