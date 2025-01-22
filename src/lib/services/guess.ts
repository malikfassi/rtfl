import { prisma } from '@/lib/db';
import { PrismaClient, Guess, Song } from '@prisma/client';
import {
  DuplicateGuessError,
  InvalidWordError,
  GameNotFoundForGuessError,
} from '@/lib/errors/guess';
import { ValidationError } from '@/lib/errors/base';

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
}

export class GuessService {
  constructor(private prisma: PrismaClient) {}

  private handleGuessError(error: unknown, context: string): never {
    console.error(`Guess service ${context} error:`, error);

    // Pass through all errors
    if (error instanceof Error) {
      throw error;
    }

    // Convert non-Error objects to Error
    throw new Error(String(error));
  }

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
    try {
      // Input validation
      if (!gameId) {
        throw new ValidationError('Game ID is required');
      }
      if (!playerId) {
        throw new ValidationError('Player ID is required');
      }
      if (!word || word.trim() === '') {
        throw new ValidationError('Word is required');
      }

      // Check if game exists and get song lyrics
      const game = await this.prisma.game.findFirst({
        where: { id: gameId },
        include: { song: true }
      });

      if (!game?.song) {
        throw new GameNotFoundForGuessError();
      }

      // Check if word exists in lyrics
      const isValidWord = await this.validateWord(word, game.song);
      if (!isValidWord) {
        throw new InvalidWordError();
      }

      // Check for duplicate guess
      const existingGuess = await this.prisma.guess.findFirst({
        where: {
          gameId,
          playerId,
          word: { equals: word.toLowerCase() }
        }
      });

      if (existingGuess) {
        throw new DuplicateGuessError();
      }

      // Create guess
      try {
        return await this.prisma.guess.create({
          data: {
            gameId,
            playerId,
            word: word.trim(),
          },
        });
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          throw new DuplicateGuessError();
        }
        throw error;
      }
    } catch (error) {
      throw this.handleGuessError(error, 'submit guess');
    }
  }

  async getPlayerGuesses(gameId: string, playerId: string): Promise<Guess[]> {
    try {
      // Input validation
      if (!gameId) {
        throw new ValidationError('Game ID is required');
      }
      if (!playerId) {
        throw new ValidationError('Player ID is required');
      }

      // Check if game exists
      const game = await this.prisma.game.findFirst({
        where: { id: gameId },
        include: { song: true }
      });

      if (!game?.song) {
        throw new GameNotFoundForGuessError();
      }

      // Get guesses
      return await this.prisma.guess.findMany({
        where: {
          gameId,
          playerId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      throw this.handleGuessError(error, 'get player guesses');
    }
  }
}

// Export factory function
export function createGuessService(client: PrismaClient = prisma) {
  return new GuessService(client);
} 