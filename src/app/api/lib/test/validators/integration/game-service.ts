import type { GameWithSong, GameWithSongAndGuesses, GameStats } from '@/app/types';
import type { Guess } from '@prisma/client';
import { songService } from './song-service';
import { guessService } from './guess-service';
import { TRACK_URIS } from '../../constants';

function getTrackKeyFromSpotifyId(spotifyId: string): string | undefined {
  return Object.keys(TRACK_URIS).find(
    key => TRACK_URIS[key as keyof typeof TRACK_URIS].split(':').pop() === spotifyId
  );
}

function validateGameStats(stats: GameStats) {
  expect(stats).toBeDefined();
  expect(stats).toHaveProperty('totalGuesses');
  expect(stats).toHaveProperty('correctGuesses');
  expect(stats).toHaveProperty('averageAttempts');
  expect(typeof stats.totalGuesses).toBe('number');
  expect(typeof stats.correctGuesses).toBe('number');
  expect(typeof stats.averageAttempts).toBe('number');
  expect(stats.totalGuesses).toBeGreaterThanOrEqual(0);
  expect(stats.correctGuesses).toBeGreaterThanOrEqual(0);
  expect(stats.averageAttempts).toBeGreaterThanOrEqual(0);
  expect(stats.correctGuesses).toBeLessThanOrEqual(stats.totalGuesses);
}

export const gameService = {
  createOrUpdate: (game: GameWithSong) => {
    expect(game).toBeDefined();
    expect(game).toHaveProperty('id');
    expect(game).toHaveProperty('date');
    expect(game).toHaveProperty('songId');
    expect(game).toHaveProperty('song');
    expect(game).toHaveProperty('createdAt');
    expect(game).toHaveProperty('updatedAt');
    expect(game).toHaveProperty('stats');
    
    // Validate data types
    expect(typeof game.id).toBe('string');
    expect(typeof game.date).toBe('string');
    expect(typeof game.songId).toBe('string');
    
    // Validate date format (YYYY-MM-DD)
    expect(game.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // Validate date is realistic (not too far in past/future)
    const gameDate = new Date(game.date);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    expect(gameDate).toBeInstanceOf(Date);
    expect(gameDate.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
    expect(gameDate.getTime()).toBeLessThanOrEqual(oneYearFromNow.getTime());
    
    // Validate song relation
    expect(game.song).toBeDefined();
    expect(game.song).toHaveProperty('id', game.songId);
    const key = getTrackKeyFromSpotifyId(game.song.spotifyId);
    expect(key).toBeDefined();
    songService.create(key!, game.song);

    // Validate stats
    validateGameStats(game.stats);
    
    return game;
  },

  getByDate: (game: GameWithSong) => {
    return gameService.createOrUpdate(game);
  },

  getByMonth: (games: GameWithSong[]) => {
    expect(games).toBeDefined();
    expect(Array.isArray(games)).toBe(true);
    
    // Validate all games are in the same month
    if (games.length > 1) {
      const firstMonth = games[0].date.substring(0, 7); // YYYY-MM
      games.forEach(game => {
        expect(game.date.substring(0, 7)).toBe(firstMonth);
      });
    }
    
    games.forEach(game => {
      gameService.createOrUpdate(game);
    });
    
    return games;
  },

  getGameWithGuesses: (game: GameWithSongAndGuesses) => {
    // Validate base game structure
    gameService.createOrUpdate(game);
    
    // Validate guesses
    expect(game).toHaveProperty('guesses');
    expect(Array.isArray(game.guesses)).toBe(true);
    
    game.guesses.forEach((guess: Guess) => {
      guessService.submitGuess(guess);
      expect(guess.gameId).toBe(game.id);
    });
    
    return game;
  }
}; 