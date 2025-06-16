interface AdminGame {
  id: string;
  date: string;
  title: string;
  artist: string;
  lyrics: string[];
  masked: {
    title: string | Array<{ value: string; isToGuess: boolean }>;
    artist: string | Array<{ value: string; isToGuess: boolean }>;
    lyrics: string | Array<{ value: string; isToGuess: boolean }>;
  };
  stats?: {
    totalPlayers: number;
    averageGuesses: number;
    averageLyricsCompletionForWinners: number;
    difficultyScore: number;
  };
}

/**
 * Get all games for a specific month
 */
export async function getAdminMonthGames(month: string): Promise<AdminGame[]> {
  const response = await fetch(`/api/admin/games/month/${month}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch month games');
  }
  
  return response.json();
}

/**
 * Get a specific game by date
 */
export async function getAdminGame(date: string): Promise<AdminGame> {
  const response = await fetch(`/api/admin/games/${date}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch game');
  }
  
  return response.json();
}

/**
 * Create a new game
 */
export async function createGame(game: Omit<AdminGame, 'id'>): Promise<AdminGame> {
  const response = await fetch('/api/admin/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(game),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create game');
  }
  
  return response.json();
}

/**
 * Update an existing game
 */
export async function updateGame(date: string, game: Partial<AdminGame>): Promise<AdminGame> {
  const response = await fetch(`/api/admin/games/${date}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(game),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update game');
  }
  
  return response.json();
}

/**
 * Delete a game
 */
export async function deleteGame(date: string): Promise<void> {
  const response = await fetch(`/api/admin/games/${date}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete game');
  }
}

/**
 * Get all games for a specific month with stats
 */
export async function getAdminMonthGamesWithStats(month: string): Promise<AdminGame[]> {
  const response = await fetch(`/api/admin/games/month/${month}/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch month games with stats');
  }
  
  return response.json();
} 