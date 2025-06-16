interface GameStats {
  totalPlayers: number;
  averageGuesses: number;
  averageLyricsCompletionForWinners: number;
  difficultyScore: number;
}

interface GameMetadata {
  id: string;
  date: string;
  title: string;
  artist: string;
  stats?: GameStats;
}

/**
 * Get metadata for all games in a month
 */
export async function getMonthGamesMetadata(month: string): Promise<GameMetadata[]> {
  const response = await fetch(`/api/games/month/${month}/metadata`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch month games metadata');
  }
  
  return response.json();
}

/**
 * Get metadata for a specific game
 */
export async function getGameMetadata(date: string): Promise<GameMetadata> {
  const response = await fetch(`/api/games/${date}/metadata`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch game metadata');
  }
  
  return response.json();
}

/**
 * Get stats for a specific game
 */
export async function getGameStats(date: string): Promise<GameStats> {
  const response = await fetch(`/api/games/${date}/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch game stats');
  }
  
  return response.json();
}

/**
 * Get stats for all games in a month
 */
export async function getMonthGamesStats(month: string): Promise<Record<string, GameStats>> {
  const response = await fetch(`/api/games/month/${month}/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch month games stats');
  }
  
  return response.json();
}

/**
 * Get the current game date
 */
export async function getCurrentGameDate(): Promise<string> {
  const response = await fetch('/api/games/current');
  
  if (!response.ok) {
    throw new Error('Failed to fetch current game date');
  }
  
  return response.json();
}

/**
 * Check if a game exists for a specific date
 */
export async function checkGameExists(date: string): Promise<boolean> {
  const response = await fetch(`/api/games/${date}/exists`);
  
  if (!response.ok) {
    throw new Error('Failed to check if game exists');
  }
  
  return response.json();
} 