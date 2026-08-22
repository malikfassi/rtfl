const PLAYER_ID_KEY = 'rtfl_player_id';

export function getOrCreatePlayerId(): string {
  // On server, return empty string - we'll handle this in the components
  if (typeof window === 'undefined') return '';
  
  let playerId: string = localStorage.getItem(PLAYER_ID_KEY) || '';
  if (!playerId) {
    // This id doubles as a bearer credential for the player's progress, so it
    // needs to be unguessable, not just unique - crypto.randomUUID() over cuid().
    playerId = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  return playerId;
} 