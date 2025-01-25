import type { Track } from '@spotify/web-api-ts-sdk';

export interface GameState {
  id: string;
  date: string;
  masked: {
    title: string;
    artist: string;
    lyrics: string;
  };
  guesses: Array<{
    id: string;
    gameId: string;
    playerId: string;
    word: string;
    createdAt: Date;
  }>;
  song?: Track;
} 