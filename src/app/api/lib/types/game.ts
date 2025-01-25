import type { Guess, Song } from '@prisma/client';

export interface GameState {
  id: string;
  date: string;
  masked: {
    title: string;
    artist: string;
    lyrics: string;
  };
  guesses: Guess[];
  song?: Song;
} 