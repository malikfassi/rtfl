import type { Song, Guess } from '@prisma/client';
import type { MaskedLyrics } from './lyrics';

export interface GameStats {
  totalPlayers: number;
  averageGuesses: number;
  totalValidGuesses: number;
  averageLyricsCompletionForWinners: number;
  difficultyScore: number;
  wins: number;
}

export interface GameState {
  id: string;
  date: string;
  masked: MaskedLyrics;
  guesses: Guess[];
  song?: Song & {
    title?: string;
    artist?: string;
  };  // Only included if game is won
  stats?: GameStats;
}