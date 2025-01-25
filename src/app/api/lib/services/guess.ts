import { Guess, PrismaClient, Song } from '@prisma/client';

import { prisma } from '@/app/api/lib/db';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/guess';
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
    const wordPattern = /([a-zA-Z0-9]|[à-ü]|[À-Ü])+/g;
    const normalizedGuess = guess.trim().match(wordPattern)?.[0] || '';
    const normalizedTarget = target.trim().match(wordPattern)?.[0] || '';
    
    // Check for exact match (case insensitive)
    return normalizedGuess.toLowerCase() === normalizedTarget.toLowerCase();
  }

  private async validateWord(word: string, song: Song): Promise<boolean> {
    const songData = song.spotifyData as unknown as SpotifyTrack;
    const wordPattern = /([a-zA-Z0-9]|[à-ü]|[À-Ü])+/g;
    const normalizedWord = word.trim().match(wordPattern)?.[0] || '';
    
    // Check against song title
    const titleWords = songData.name.split(/\s+/).map(w => w.match(wordPattern)?.[0] || '').filter(Boolean);
    if (titleWords.some(titleWord => this.isExactWordMatch(normalizedWord, titleWord))) {
      return true;
    }

    // Check against artist name
    if (songData.artists && songData.artists.length > 0) {
      const artistWords = songData.artists[0].name.split(/\s+/).map(w => w.match(wordPattern)?.[0] || '').filter(Boolean);
      if (artistWords.some(artistWord => this.isExactWordMatch(normalizedWord, artistWord))) {
        return true;
      }
    }

    // Split lyrics into words and check each one
    const lyrics = song.lyrics.split(/\s+/).map(w => w.match(wordPattern)?.[0] || '').filter(Boolean);
    return lyrics.some(lyricWord => this.isExactWordMatch(normalizedWord, lyricWord));
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

    // Check if word exists in lyrics
    const isValidWord = await this.validateWord(guess, game.song);
    if (!isValidWord) {
      throw new InvalidWordError();
    }

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

    // Create guess
    await this.prisma.guess.create({
      data: {
        gameId: game.id,
        playerId: userId,
        word: guess.toLowerCase().trim(),
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