import type { Song, Guess } from '@prisma/client';
import type { MaskedLyrics } from './lyrics';

export interface GameState {
  id: string;
  date: string;
  masked: MaskedLyrics;
  guesses: Guess[];
  song?: Song & {
    title?: string;
    artist?: string;
  };  // Only included if game is won
}