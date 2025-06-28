import { Guess, PrismaClient, Song } from '@prisma/client';
import { validateSchema, dateSchema, playerIdSchema, monthSchema } from '@/app/api/lib/validation';
import { prisma } from '@/app/api/lib/db';
import type { MaskedLyrics, Token } from '@/app/types';
import type { GameState } from '@/app/types';
import type { GameWithSongAndGuesses } from '@/app/types';
import { createGameService } from './game';

export class GameStateService {
  constructor(
    private prisma: PrismaClient,
    private gameService = createGameService(undefined, prisma)
  ) {}

  private isGameWon(song: Song, guesses: Guess[]): boolean {
    const compactGuesses = guesses.map(g => `${g.word}:${g.valid ? '✓' : '✗'}`);
    console.log('isGameWon guesses (word:valid):', compactGuesses.join(', '));
    // Get valid guessed words
    const validGuessedWords = new Set(
      guesses.filter(g => g.valid).map(g => g.word.toLowerCase())
    );
    
    // Get the tokens from maskedLyrics
    const maskedLyrics = song.maskedLyrics as unknown as MaskedLyrics;
    
    // Handle case where maskedLyrics is undefined or null
    if (!maskedLyrics || !maskedLyrics.title || !maskedLyrics.artist || !maskedLyrics.lyrics) {
      return false;
    }
    
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
    const compactGuesses = game.guesses.map(g => `${g.word}:${g.valid ? '✓' : '✗'}`);
    console.log('mapGameToGameState guesses (word:valid):', compactGuesses.join(', '));
    const isWon = this.isGameWon(game.song, game.guesses);
    const masked = game.song.maskedLyrics as unknown as MaskedLyrics;

    // Handle case where maskedLyrics is undefined or null
    if (!masked || !masked.title || !masked.artist || !masked.lyrics) {
      return {
        id: game.id,
        date: game.date,
        masked: { title: [], artist: [], lyrics: [] },
        guesses: game.guesses,
        song: undefined
      };
    }

    // Get set of guessed words
    const guessedWords = new Set(game.guesses.filter(g => g.valid).map(g => g.word.toLowerCase()));

    // Helper to mask tokens
    function maskTokens(tokens: Token[]): Token[] {
      return tokens.map(token => {
        if (!token.isToGuess) return token;
        // If the game is won or the word has been guessed, show the word
        if (isWon || guessedWords.has(token.value.toLowerCase())) {
          return token;
        }
        // Otherwise, mask the word with underscores
        return { ...token, value: '_'.repeat(token.value.length) };
      });
    }

    let songWithTitleArtist: typeof game.song & { title?: string; artist?: string } | undefined = undefined;
    if (isWon) {
      const geniusData = game.song.geniusData as { title?: string; artist?: string } | undefined;
      songWithTitleArtist = {
        ...game.song,
        title: geniusData?.title ?? '',
        artist: geniusData?.artist ?? '',
      };
    }

    return {
      id: game.id,
      date: game.date,
      masked: {
        title: maskTokens(masked.title),
        artist: maskTokens(masked.artist),
        lyrics: maskTokens(masked.lyrics)
      },
      guesses: game.guesses,
      song: songWithTitleArtist
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
    // Validate month format first
    validateSchema(monthSchema, month);
    // Validate player ID
    validateSchema(playerIdSchema, userId);

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