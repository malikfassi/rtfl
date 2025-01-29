import { Guess, PrismaClient, Song } from '@prisma/client';

import { prisma } from '@/app/api/lib/db';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/services/guess';
import { validateSchema } from '@/app/api/lib/validation';
import { dateSchema, gameIdSchema, playerIdSchema, wordSchema } from '@/app/api/lib/validation';
import { gameStateService } from '@/app/api/lib/services/game-state';
import type { GameState } from '@/app/api/lib/types/game';

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
}

export class GuessService {
  constructor(private prisma: PrismaClient) {}

  private isExactWordMatch(guess: string, target: string): boolean {
    // Convert both strings to lowercase and normalize whitespace
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedTarget = target.trim().toLowerCase();
    
    // Check for exact match (case insensitive)
    return normalizedGuess === normalizedTarget;
  }

  private extractWords(text: string): string[] {
    // Split on spaces first
    return text.split(/\s+/).flatMap(word => {
      // Handle special cases like "P!nk" -> ["P", "nk"]
      // and possessives like "Taylor's" -> ["Taylor", "s"]
      const specialCharSplit = word.split(/([!@#$%^&*()\-_+=[\]{}|\\:;"'<>,.?/])/);
      return specialCharSplit
        .map(part => part.trim())
        .filter(part => part.length > 0 && !/^[!@#$%^&*()\-_+=[\]{}|\\:;"'<>,.?/]$/.test(part));
    });
  }

  private async validateWord(word: string, song: Song): Promise<boolean> {
    const songData = song.spotifyData as unknown as SpotifyTrack;
    const normalizedGuess = word.trim().toLowerCase();
    
    // Extract and check title words
    const titleWords = this.extractWords(songData.name);
    if (titleWords.some(titleWord => this.isExactWordMatch(normalizedGuess, titleWord))) {
      return true;
    }

    // Extract and check artist words
    if (songData.artists && songData.artists.length > 0) {
      const artistWords = this.extractWords(songData.artists[0].name);
      if (artistWords.some(artistWord => this.isExactWordMatch(normalizedGuess, artistWord))) {
        return true;
      }
    }

    // Extract and check lyrics words
    const lyricsWords = this.extractWords(song.lyrics);
    return lyricsWords.some(lyricWord => this.isExactWordMatch(normalizedGuess, lyricWord));
  }

  async submitGuess({ date, userId, guess }: { date: string; userId: string; guess: string }): Promise<GameState> {
    // Validate date first
    validateSchema(dateSchema, date);

    // Get game by date
    const game = await this.prisma.game.findUnique({
      where: { date },
      include: { song: true }
    });

    if (!game?.song) {
      throw new GameNotFoundForGuessError(date);
    }

    // Then validate other inputs
    validateSchema(playerIdSchema, userId);
    validateSchema(wordSchema, guess);

    // Check for duplicate guess
    const existingGuess = await this.prisma.guess.findFirst({
      where: {
        gameId: game.id,
        playerId: userId,
        word: { equals: guess.toLowerCase() }
      }
    });

    if (existingGuess) {
      throw new DuplicateGuessError();
    }

    // Check if word exists in lyrics/title/artist
    const isValidWord = await this.validateWord(guess, game.song);

    // Create guess with valid flag
    await this.prisma.guess.create({
      data: {
        gameId: game.id,
        playerId: userId,
        word: guess.toLowerCase().trim(),
        valid: isValidWord
      }
    });

    // Return updated game state
    return gameStateService.getGameState(date, userId);
  }

  async getPlayerGuesses(gameId: string, playerId: string): Promise<Guess[]> {
    // Validate inputs
    validateSchema(gameIdSchema, gameId);
    validateSchema(playerIdSchema, playerId);

    // Check if game exists
    const game = await this.prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      throw new GameNotFoundForGuessError('unknown');
    }

    // Get guesses
    return this.prisma.guess.findMany({
      where: {
        gameId,
        playerId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}

// Export factory function
export function createGuessService(client: PrismaClient = prisma) {
  return new GuessService(client);
}

// Export default instance
export const guessService = new GuessService(prisma); 