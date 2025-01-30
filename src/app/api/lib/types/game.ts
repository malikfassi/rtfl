import type { Game, Guess, Song } from '@prisma/client';

// Type for Game with included song relation
export type GameWithSong = Game & {
  song: Song;
};

// Type for Game with included song and guesses relations
export type GameWithSongAndGuesses = GameWithSong & {
  guesses: Guess[];
};
