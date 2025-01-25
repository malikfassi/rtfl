import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a 25-character alphanumeric string using UUID v4
function generatePlayerId(): string {
  // Create UUID v4 and remove dashes to get a 32-character hex string
  const uuid = crypto.randomUUID().replace(/-/g, '');
  // Take first 25 characters to match our validation requirement
  return uuid.slice(0, 25);
}

const PLAYER_ID_KEY = 'rtfl_player_id';

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  
  let playerId = localStorage.getItem(PLAYER_ID_KEY);
  if (!playerId) {
    playerId = generatePlayerId();
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  return playerId;
} 