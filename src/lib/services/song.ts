import { prisma } from '@/lib/db';
import { GeniusError } from '@/lib/clients/genius';
import { getGeniusClient } from '@/lib/clients/genius';
import { getSpotifyClient } from '@/lib/clients/spotify';
import { Song, Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export class SongError extends Error {
  constructor(
    message: string,
    public code: 'INTERNAL_ERROR' | 'GENIUS_NOT_FOUND' | 'SPOTIFY_NOT_FOUND' | 'INVALID_INPUT'
  ) {
    super(message);
    this.name = 'SongError';
  }
}

export class SongService {
  private prisma: PrismaClient;
  private geniusClient;
  private spotifyClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.geniusClient = getGeniusClient(process.env.GENIUS_ACCESS_TOKEN);
    this.spotifyClient = getSpotifyClient(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET
    );
  }

  private extractWords(lyrics: string): string[] {
    return lyrics
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private maskWord(word: string): string {
    // Simply replace all alphanumeric characters with underscores
    return word.replace(/[a-zA-Z0-9]/g, '_');
  }

  private splitPreservingNewlines(text: string): string[] {
    // Split by whitespace and newlines, keeping all other characters
    return text.split(/(\n|\s+)/).filter(token => token.length > 0);
  }

  private createMaskedLyrics(title: string, artist: string, lyrics: string): Prisma.JsonObject {
    return {
      title: this.splitPreservingNewlines(title).map(word => this.maskWord(word)),
      artist: this.splitPreservingNewlines(artist).map(word => this.maskWord(word)),
      lyrics: this.splitPreservingNewlines(lyrics).map(word => this.maskWord(word))
    };
  }

  async create(spotifyId: string, tx?: Prisma.TransactionClient): Promise<Song> {
    try {
      // Get track from Spotify
      const track = await this.spotifyClient.getTrack(spotifyId);
      if (!track) {
        throw new SongError('Track not found', 'SPOTIFY_NOT_FOUND');
      }

      // Get lyrics from Genius
      const title = track.name;
      const artist = track.artists[0].name;

      // Try multiple search variations
      const searchAttempts = [
        `${title} ${artist}`,
        title,
        // Remove parentheses and their contents
        `${title.replace(/\([^)]*\)/g, '').trim()} ${artist}`,
        // Remove 'feat.' and everything after
        `${title.replace(/\s*(?:feat|ft|featuring)\.?.*/i, '').trim()} ${artist}`
      ];

      let lyrics: string | null = null;
      let lastError: Error | null = null;

      for (const searchQuery of searchAttempts) {
        try {
          console.log('Trying search query:', searchQuery);
          lyrics = await this.geniusClient.searchSong(searchQuery);
          if (lyrics) break;
        } catch (error) {
          console.warn(`Failed attempt with query "${searchQuery}":`, error);
          lastError = error as Error;
        }
      }

      if (!lyrics) {
        const errorMessage = lastError instanceof GeniusError ?
          lastError.code === 'GENIUS_NOT_FOUND' ?
            `No lyrics found for "${title}" by "${artist}"` :
            `Failed to fetch lyrics for "${title}" by "${artist}" - ${lastError.message}` :
          `Failed to fetch lyrics for "${title}" by "${artist}" - ${lastError?.message}`;
        throw new SongError(errorMessage, 'GENIUS_NOT_FOUND');
      }

      const lyricsStr: string = lyrics;

      // Create song with lyrics
      const prisma = tx || this.prisma;
      return await prisma.song.create({
        data: {
          spotifyId,
          spotifyData: JSON.parse(JSON.stringify(track)) as Prisma.InputJsonValue,
          geniusData: JSON.parse(JSON.stringify({})) as Prisma.InputJsonValue,
          lyrics: lyricsStr,
          maskedLyrics: this.createMaskedLyrics(title, artist, lyricsStr)
        }
      });
    } catch (error) {
      if (error instanceof SongError) {
        throw error;
      }
      throw new SongError('Failed to create song', 'INTERNAL_ERROR');
    }
  }
}

// Export factory function
export function createSongService() {
  return new SongService(prisma);
}

// Export standalone functions
export async function getTrack(id: string) {
  const spotifyClient = getSpotifyClient(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );
  return spotifyClient.getTrack(id);
}

export async function searchTracks(query: string) {
  const spotifyClient = getSpotifyClient(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );
  return spotifyClient.searchTracks(query);
}

export async function getLyrics(query: string): Promise<string | null> {
  try {
    const geniusClient = getGeniusClient(process.env.GENIUS_ACCESS_TOKEN);
    return await geniusClient.searchSong(query);
  } catch (error) {
    console.error('Failed to get lyrics:', error);
    return null;
  }
} 