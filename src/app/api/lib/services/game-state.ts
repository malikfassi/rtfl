import { Guess, PrismaClient, Song } from '@prisma/client';
import { GameNotFoundError } from '@/app/api/lib/errors/services/game';
import { validateSchema, dateSchema, playerIdSchema } from '@/app/api/lib/validation';
import { prisma } from '@/app/api/lib/db';
import type { MaskedLyrics } from '@/app/api/lib/types/lyrics';

interface SpotifyData {
  name: string;
  artists: Array<{ name: string }>;
}

interface InternalGameState {
  id: string;
  date: string;
  masked: MaskedLyrics;
  guesses: Guess[];
  song?: Song;  // Only included if game is won
}

export class GameStateService {
  constructor(private prisma: PrismaClient) {}

  private extractWords(text: string): string[] {
    return Array.from(text.toLowerCase().matchAll(/\p{L}+|\p{N}+/gu), m => m[0]);
  }

  private isGameWon(song: Song, guesses: Guess[], playerId: string): boolean {
    // Filter guesses to only include those from this player
    const playerGuesses = guesses.filter(g => g.playerId === playerId);
    const guessedWords = new Set(playerGuesses.map(g => g.word.toLowerCase()));
    
    // Get all words from title and artist
    const spotifyData = song.spotifyData as unknown as SpotifyData;
    // Split on word boundaries using same regex as lyricsService
    const titleWords = this.extractWords(spotifyData.name);
    const artistWords = this.extractWords(spotifyData.artists[0].name);
    const lyricsWords = this.extractWords(song.lyrics);

    // Calculate percentage of lyrics guessed
    const lyricsGuessed = lyricsWords.filter(word => guessedWords.has(word)).length;
    const lyricsPercentage = lyricsGuessed / lyricsWords.length;

    // Check if all title words are guessed
    const allTitleWordsGuessed = titleWords.every(word => guessedWords.has(word));
    // Check if all artist words are guessed
    const allArtistWordsGuessed = artistWords.every(word => guessedWords.has(word));

    // Game is won if 80% of lyrics are guessed OR both title AND artist are fully guessed
    return lyricsPercentage >= 0.8 || (allTitleWordsGuessed && allArtistWordsGuessed);
  }

  async getGameState(date: string, userId: string): Promise<InternalGameState> {
    // Validate date first
    validateSchema(dateSchema, date);

    const game = await this.prisma.game.findUnique({
      where: { date },
      include: {
        song: true,
        guesses: {
          where: { playerId: userId },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!game?.song) {
      throw new GameNotFoundError(date);
    }

    // Validate player ID after confirming game exists
    validateSchema(playerIdSchema, userId);

    const isWon = this.isGameWon(game.song, game.guesses, userId);
    const maskedData = game.song.maskedLyrics as unknown as MaskedLyrics;
    if (!maskedData || typeof maskedData !== 'object' || !('title' in maskedData)) {
      throw new Error('Invalid masked lyrics data');
    }

    // Get guessed words for this player
    const guessedWords = new Set(game.guesses.map(g => g.word.toLowerCase()));

    // Create masked state based on guessed words
    const spotifyData = game.song.spotifyData as unknown as SpotifyData;
    const masked = {
      title: this.maskTextWithGuesses(spotifyData.name, guessedWords),
      artist: this.maskTextWithGuesses(spotifyData.artists[0].name, guessedWords),
      lyrics: this.maskTextWithGuesses(game.song.lyrics, guessedWords)
    };

    return {
      id: game.id,
      date: game.date,
      masked,
      guesses: game.guesses,
      song: isWon ? game.song : undefined
    };
  }

  private maskTextWithGuesses(text: string, guessedWords: Set<string>): string {
    // Normalize guessedWords for case-insensitive matching
    const normalizedGuessedWords = new Set(
      Array.from(guessedWords).map(word => word.toLowerCase())
    );

    // Mask all letters and numbers, but preserve guessed words
    return text.replace(/\p{L}+|\p{N}+/gu, (word) => {
      const normalizedWord = word.toLowerCase();
      return normalizedGuessedWords.has(normalizedWord) ? word : '_'.repeat(word.length);
    });
  }

  async getGameStatesByMonth(month: string, userId: string): Promise<InternalGameState[]> {
    const startDate = new Date(month + '-01');
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const games = await this.prisma.game.findMany({
      where: {
        date: {
          gte: startDate.toISOString().split('T')[0],
          lt: endDate.toISOString().split('T')[0]
        }
      },
      include: {
        song: true,
        guesses: {
          where: { playerId: userId },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return games
      .filter(game => game.song)
      .map(game => {
        const isWon = this.isGameWon(game.song!, game.guesses, userId);

        // Get guessed words for this player
        const guessedWords = new Set(game.guesses.map(g => g.word.toLowerCase()));

        // Create masked state based on guessed words
        const spotifyData = game.song!.spotifyData as unknown as SpotifyData;
        const masked = {
          title: this.maskTextWithGuesses(spotifyData.name, guessedWords),
          artist: this.maskTextWithGuesses(spotifyData.artists[0].name, guessedWords),
          lyrics: this.maskTextWithGuesses(game.song!.lyrics, guessedWords)
        };

        return {
          id: game.id,
          date: game.date,
          masked,
          guesses: game.guesses,
          song: isWon ? game.song : undefined
        };
      });
  }
}

// Export factory function
export function createGameStateService(client: PrismaClient = prisma) {
  return new GameStateService(client);
}

// Export default instance
export const gameStateService = new GameStateService(prisma); 