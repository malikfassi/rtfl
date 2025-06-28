import type { Track } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '@/app/types';
import type { GameState } from '@/app/types';
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
