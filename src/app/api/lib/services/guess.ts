import { Guess, PrismaClient } from '@prisma/client';

import { prisma } from '@/app/api/lib/db';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError
} from '@/app/api/lib/errors/services/guess';
import { validateSchema } from '@/app/api/lib/validation';
import { dateSchema, gameIdSchema, playerIdSchema, wordSchema } from '@/app/api/lib/validation';
import type { MaskedLyrics } from '@/app/api/lib/types/lyrics';
import { maskedLyricsService } from './masked-lyrics';

export class GuessService {
  constructor(private prisma: PrismaClient) {}

  async submitGuess({ date, userId, guess }: { date: string; userId: string; guess: string }): Promise<Guess> {
    // 1. Validate inputs
    validateSchema(dateSchema, date);
    validateSchema(playerIdSchema, userId);
    validateSchema(wordSchema, guess);

    // 2. Get game and validate it exists
    const game = await this.prisma.game.findUnique({
      where: { date },
      include: { song: true }
    });

    if (!game?.song) {
      throw new GameNotFoundForGuessError(date);
    }

    // 3. Check for duplicate guess
    const normalizedGuess = guess.toLowerCase().trim();
    const existingGuess = await this.prisma.guess.findFirst({
      where: {
        gameId: game.id,
        playerId: userId,
        word: { equals: normalizedGuess }
      }
    });

    if (existingGuess) {
      throw new DuplicateGuessError();
    }

    // 4. Validate word against masked lyrics
    const maskedLyrics = game.song.maskedLyrics as unknown as MaskedLyrics;
    const isValidWord = maskedLyricsService.hasWord(normalizedGuess, maskedLyrics);

    // 5. Create and return guess record
    return await this.prisma.guess.create({
      data: {
        gameId: game.id,
        playerId: userId,
        word: normalizedGuess,
        valid: isValidWord
      }
    });
  }

  async getPlayerGuesses(gameId: string, playerId: string): Promise<Guess[]> {
    // 1. Validate inputs
    validateSchema(gameIdSchema, gameId);
    validateSchema(playerIdSchema, playerId);

    // 2. Check if game exists
    const game = await this.prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      throw new GameNotFoundForGuessError('unknown');
    }

    // 3. Get guesses
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
export function createGuessService(client: PrismaClient) {
  return new GuessService(client);
} 