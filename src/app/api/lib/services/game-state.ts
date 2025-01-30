import { Guess, PrismaClient, Song } from '@prisma/client';
import { validateSchema, dateSchema, playerIdSchema } from '@/app/api/lib/validation';
import { prisma } from '@/app/api/lib/db';
import type { MaskedLyrics } from '@/app/api/lib/types/lyrics';
import type { GameState } from '@/app/api/lib/types/game-state';
import type { GameWithSongAndGuesses } from '@/app/api/lib/types/game';
import { createGameService } from './game';

export class GameStateService {
  constructor(
    private prisma: PrismaClient,
    private gameService = createGameService(undefined, prisma)
  ) {}

  private isGameWon(song: Song, guesses: Guess[]): boolean {
    // Get valid guessed words
    const validGuessedWords = new Set(
      guesses.filter(g => g.valid).map(g => g.word.toLowerCase())
    );
    
    // Get the tokens from maskedLyrics
    const maskedLyrics = song.maskedLyrics as unknown as MaskedLyrics;
    
    // Count guessed tokens for each part (only counting isToGuess tokens)
    const titleAndArtistGuessed = [...maskedLyrics.title, ...maskedLyrics.artist]
      .filter(token => token.isToGuess && validGuessedWords.has(token.value.toLowerCase()))
      .length;
    
    const lyricsGuessed = maskedLyrics.lyrics
      .filter(token => token.isToGuess && validGuessedWords.has(token.value.toLowerCase()))
      .length;

    const totalTitleAndArtist = [...maskedLyrics.title, ...maskedLyrics.artist]
      .filter(token => token.isToGuess)
      .length;
    const totalLyrics = maskedLyrics.lyrics
      .filter(token => token.isToGuess)
      .length;

    // Game is won if:
    // - 80% or more of lyrics tokens are guessed OR
    // - All title and artist tokens are guessed
    return (lyricsGuessed >= totalLyrics * 0.8) || (titleAndArtistGuessed >= totalTitleAndArtist);
  }

  private mapGameToGameState(game: GameWithSongAndGuesses): GameState {
    const isWon = this.isGameWon(game.song, game.guesses);
    const masked = game.song.maskedLyrics as unknown as MaskedLyrics;

    return {
      id: game.id,
      date: game.date,
      masked,
      guesses: game.guesses,
      song: isWon ? game.song : undefined
    };
  }

  async getGameState(date: string, userId: string): Promise<GameState> {
    // Validate date first
    validateSchema(dateSchema, date);
    // Validate player ID
    validateSchema(playerIdSchema, userId);

    const game = await this.gameService.getGameWithGuesses(date, userId);
    return this.mapGameToGameState(game);
  }

  async getGameStatesByMonth(month: string, userId: string): Promise<GameState[]> {
    const startDate = new Date(month + '-01');
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const games = await this.gameService.getGamesWithGuesses(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      userId
    );

    return games.map(game => this.mapGameToGameState(game));
  }
}

// Export factory function
export function createGameStateService(client: PrismaClient = prisma) {
  return new GameStateService(client);
}

// Export default instance
export const gameStateService = new GameStateService(prisma); 