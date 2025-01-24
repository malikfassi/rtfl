import { Guess, PrismaClient, Song } from '@prisma/client';

import { prisma } from '@/app/api/lib/db';
import {
  DuplicateGuessError,
  GameNotFoundForGuessError,
  InvalidWordError} from '@/app/api/lib/errors/guess';
import { validateSchema } from '@/app/api/lib/validation';
import { gameIdSchema, playerIdSchema, submitGuessSchema } from '@/app/api/lib/validation';

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

  async submitGuess(gameId: string, playerId: string, word: string): Promise<Guess> {
    // Validate all inputs using the schema
    const validatedData = validateSchema(submitGuessSchema, { gameId, playerId, word });

    // Check if game exists and get song lyrics
    const game = await this.prisma.game.findFirst({
      where: { id: validatedData.gameId },
      include: { song: true }
    });

    if (!game?.song) {
      throw new GameNotFoundForGuessError();
    }

    // Check if word exists in lyrics
    const isValidWord = await this.validateWord(validatedData.word, game.song);
    if (!isValidWord) {
      throw new InvalidWordError();
    }

    // Check for duplicate guess
    const existingGuess = await this.prisma.guess.findFirst({
      where: {
        gameId: validatedData.gameId,
        playerId: validatedData.playerId,
        word: { equals: validatedData.word.toLowerCase() }
      }
    });

    if (existingGuess) {
      throw new DuplicateGuessError();
    }

    // Create guess
    return await this.prisma.guess.create({
      data: {
        gameId: validatedData.gameId,
        playerId: validatedData.playerId,
        word: validatedData.word.trim(),
      },
    });
  }

  async getPlayerGuesses(gameId: string, playerId: string): Promise<Guess[]> {
    // Validate inputs
    const validatedGameId = validateSchema(gameIdSchema, gameId);
    const validatedPlayerId = validateSchema(playerIdSchema, playerId);

    // Check if game exists
    const game = await this.prisma.game.findFirst({
      where: { id: validatedGameId },
      include: { song: true }
    });

    if (!game?.song) {
      throw new GameNotFoundForGuessError();
    }

    // Get guesses
    return await this.prisma.guess.findMany({
      where: {
        gameId: validatedGameId,
        playerId: validatedPlayerId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

// Export factory function
export function createGuessService(client: PrismaClient = prisma) {
  return new GuessService(client);
} 