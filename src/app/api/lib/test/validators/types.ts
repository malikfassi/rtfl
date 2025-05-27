import type { Track } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '@/app/api/lib/types/genius';
import type { GameState } from '@/app/api/lib/types/game-state';
import type { SpotifyFixtures, GeniusFixtures } from '../fixtures';
import type { Game, Song, Guess } from '@prisma/client';

// Re-export source types
export type {
  GameState,
  GeniusSearchResponse,
  Track,
  Game,
  Song,
  Guess
};

// Export fixture types
export type {
  SpotifyFixtures,
  GeniusFixtures
}; 
