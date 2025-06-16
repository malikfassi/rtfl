import { getOrCreatePlayerId } from '../utils';

interface PlayerGuess {
  id: string;
  gameId: string;
  playerId: string;
  word: string;
  createdAt: Date;
  valid: boolean;
}

interface PlayerGameState {
  id: string;
  date: string;
  masked: {
    title: string | Array<{ value: string; isToGuess: boolean }>;
    artist: string | Array<{ value: string; isToGuess: boolean }>;
    lyrics: string | Array<{ value: string; isToGuess: boolean }>;
  };
  guesses: PlayerGuess[];
  stats?: {
    totalPlayers: number;
    averageGuesses: number;
    averageLyricsCompletionForWinners: number;
    difficultyScore: number;
  };
}

/**
 * Get the current game state for a player
 */
export async function getPlayerGameState(date: string): Promise<PlayerGameState> {
  const playerId = getOrCreatePlayerId();
  const response = await fetch(`/api/games/${date}?playerId=${playerId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch game state');
  }
  
  return response.json();
}

/**
 * Submit a guess for the current game
 */
export async function submitGuess(date: string, word: string): Promise<PlayerGuess> {
  const playerId = getOrCreatePlayerId();
  const response = await fetch(`/api/games/${date}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ word, playerId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit guess');
  }
  
  return response.json();
}

/**
 * Get game stats for a specific date
 */
export async function getGameStats(date: string): Promise<PlayerGameState['stats']> {
  const response = await fetch(`/api/games/${date}/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch game stats');
  }
  
  return response.json();
}

/**
 * Get all games for a specific month
 */
export async function getMonthGames(month: string): Promise<PlayerGameState[]> {
  const playerId = getOrCreatePlayerId();
  const response = await fetch(`/api/games/month/${month}?playerId=${playerId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch month games');
  }
  
  return response.json();
} 