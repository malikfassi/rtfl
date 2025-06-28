const PLAYER_ID_KEY = 'rtfl_player_id';

export function getOrCreatePlayerId(): string {
  // On server, return empty string - we'll handle this in the components
  if (typeof window === 'undefined') return '';
  
  let playerId: string = localStorage.getItem(PLAYER_ID_KEY) || '';
  if (!playerId) {
    // Use require to avoid import issues
    const cuid = require('cuid');
    playerId = cuid();
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  return playerId;
} 