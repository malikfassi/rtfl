import { Game, Guess, PrismaClient, Song } from '@prisma/client';
import { GameNotFoundError } from '@/app/api/lib/errors/game';
import { validateSchema, dateSchema, playerIdSchema } from '@/app/api/lib/validation';
import { prisma } from '@/app/api/lib/db';
import { lyricsService } from '@/app/api/lib/services/lyrics';
import { ValidationError } from '@/app/api/lib/errors/base';
import type { SpotifyTrack } from '@/app/api/lib/types/spotify';
import type { MaskedLyrics } from '@/app/api/lib/types/lyrics';

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
    const titleWords = spotifyData.name.toLowerCase().split(/\s+/);
    const artistWords = spotifyData.artists[0].name.toLowerCase().split(/\s+/);
    const lyricsWords = song.lyrics.toLowerCase().split(/\s+/);

    // Calculate percentage of lyrics guessed
    const lyricsGuessed = lyricsWords.filter(word => guessedWords.has(word)).length;
    const lyricsPercentage = lyricsGuessed / lyricsWords.length;

    // Calculate percentage of title and artist guessed
    const titleAndArtistWords = [...titleWords, ...artistWords];
    const titleAndArtistGuessed = titleAndArtistWords.filter(word => guessedWords.has(word)).length;
    const titleAndArtistPercentage = titleAndArtistGuessed / titleAndArtistWords.length;

    // Game is won if 80% of lyrics are guessed OR 100% of title and artist are guessed
    return lyricsPercentage >= 0.8 || titleAndArtistPercentage >= 1;
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
      guesses: game.guesses, // Keep all guesses visible but mask based on player's guesses
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