import { Guess, PrismaClient, Song } from '@prisma/client';
import { GameNotFoundError } from '@/app/api/lib/errors/game';
import { validateSchema, dateSchema, playerIdSchema } from '@/app/api/lib/validation';
import { prisma } from '@/app/api/lib/db';
import { lyricsService } from '@/app/api/lib/services/lyrics';
import type { SpotifyTrack } from '@/app/api/lib/types/spotify';

interface GameState {
  id: string;
  date: string;
  masked: {
    title: string;    // Masked title with revealed correct guesses
    artist: string;   // Masked artist with revealed correct guesses
    lyrics: string;   // Masked lyrics with revealed correct guesses
  };
  guesses: Guess[];
  song?: SpotifyTrack;  // Only included if game is won
}

export class GameStateService {
  constructor(private prisma: PrismaClient) {}

  private isGameWon(song: Song, guesses: Guess[], playerId: string): boolean {
    // Filter guesses to only include those from this player
    const playerGuesses = guesses.filter(g => g.playerId === playerId);
    const guessedWords = new Set(playerGuesses.map(g => g.word.toLowerCase()));
    
    // Get all words from title and artist
    const spotifyData = song.spotifyData as unknown as SpotifyTrack;
    // Split on word boundaries using same regex as lyricsService
    const titleWords = Array.from(spotifyData.name.toLowerCase().matchAll(/\p{L}+|\p{N}+/gu)).map(m => m[0]);
    const artistWords = Array.from(spotifyData.artists[0].name.toLowerCase().matchAll(/\p{L}+|\p{N}+/gu)).map(m => m[0]);
    const lyricsWords = Array.from(song.lyrics.toLowerCase().matchAll(/\p{L}+|\p{N}+/gu)).map(m => m[0]);

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

  async getGameState(date: string, playerId: string): Promise<GameState> {
    const validatedDate = validateSchema(dateSchema, date);

    // Get game with song and guesses
    const game = await this.prisma.game.findUnique({
      where: { date: validatedDate },
      include: { 
        song: true,
        guesses: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!game) {
      throw new GameNotFoundError(validatedDate);
    }

    // Validate player ID after confirming game exists
    const validatedPlayerId = validateSchema(playerIdSchema, playerId);
    const spotifyData = game.song.spotifyData as unknown as SpotifyTrack;

    // Filter guesses for this player
    const playerGuesses = game.guesses.filter(g => g.playerId === validatedPlayerId);
    const guessedWords = new Set(playerGuesses.map(g => g.word));

    // Check if game is won by this player
    const isWon = this.isGameWon(game.song, game.guesses, validatedPlayerId);

    // Get partially revealed lyrics based on player's guesses
    const masked = {
      title: lyricsService.partial_mask(spotifyData.name, guessedWords),
      artist: lyricsService.partial_mask(spotifyData.artists[0].name, guessedWords),
      lyrics: lyricsService.partial_mask(game.song.lyrics, guessedWords)
    };

    return {
      id: game.id,
      date: game.date,
      masked,
      guesses: playerGuesses, // Only return guesses for this player
      song: isWon ? spotifyData : undefined
    };
  }
}

// Export default instance
export const gameStateService = new GameStateService(prisma);

// Factory function for testing
export const createGameStateService = (prismaClient: PrismaClient = prisma) => {
  return new GameStateService(prismaClient);
}; 