import type { Game, Guess, Song } from '@prisma/client';

export type GameStats = {
  totalGuesses: number;
  correctGuesses: number;
  averageAttempts: number;
  wins: number;
};

// Type for Game with included song relation
export type GameWithSong = Game & {
  song: Song;
  stats: GameStats;
};

// Type for Game with included song and guesses relations
export type GameWithSongAndGuesses = GameWithSong & {
  guesses: Guess[];
};
