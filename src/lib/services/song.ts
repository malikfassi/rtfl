import { prisma } from '@/lib/db';
import { geniusClient } from '@/lib/clients/genius';
import { Song } from '@prisma/client';
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

interface ProgressCallback {
  (status: {
    type: 'progress' | 'success' | 'error';
    message: string;
    date?: string;
    song?: {
      title: string;
      artist: string;
    };
  }): void;
}

export class SongService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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

  private createMaskedLyrics(title: string, artist: string, lyrics: string) {
    return {
      title: this.splitPreservingNewlines(title).map(word => this.maskWord(word)),
      artist: this.splitPreservingNewlines(artist).map(word => this.maskWord(word)),
      lyrics: this.splitPreservingNewlines(lyrics).map(word => this.maskWord(word))
    };
  }

  async getOrCreate(
    spotifyId: string,
    title: string | undefined,
    artist: string | undefined,
    date?: string,
    onProgress?: ProgressCallback
  ): Promise<Song> {
    try {
      // Validate inputs
      if (!spotifyId || !title || !artist) {
        const error = new SongError(
          `Invalid input parameters: spotifyId="${spotifyId}", title="${title}", artist="${artist}"`,
          'INVALID_INPUT'
        );
        onProgress?.({
          type: 'error',
          message: error.message,
          date,
          song: title && artist ? { title, artist } : undefined
        });
        throw error;
      }

      onProgress?.({
        type: 'progress',
        message: `Looking for existing song "${title}" by "${artist}"...`,
        date,
        song: { title, artist }
      });

      // First try to find existing song
      const existing = await this.prisma.song.findFirst({
        where: { spotifyId }
      });

      if (existing) {
        onProgress?.({
          type: 'success',
          message: `Found existing song "${title}" by "${artist}"`,
          date,
          song: { title, artist }
        });
        return existing;
      }

      // Get lyrics from Genius
      onProgress?.({
        type: 'progress',
        message: `Fetching lyrics for "${title}" by "${artist}"...`,
        date,
        song: { title, artist }
      });

      let lyrics: string;
      try {
        lyrics = await geniusClient.searchSong(title, artist);
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = error.name === 'GeniusError' ? 
            `No lyrics found for "${title}" by "${artist}"` :
            `Failed to fetch lyrics for "${title}" by "${artist}" - ${error.message}`;

          onProgress?.({
            type: 'error',
            message: errorMessage,
            date,
            song: { title, artist }
          });

          throw new SongError(errorMessage, 'GENIUS_NOT_FOUND');
        }
        throw error;
      }

      onProgress?.({
        type: 'success',
        message: `Found lyrics for "${title}" by "${artist}"`,
        date,
        song: { title, artist }
      });

      onProgress?.({
        type: 'progress',
        message: `Creating song "${title}" by "${artist}"...`,
        date,
        song: { title, artist }
      });

      // Create song with lyrics
      const song = await this.prisma.song.create({
        data: {
          spotifyId,
          title,
          artist,
          lyrics,
          maskedLyrics: this.createMaskedLyrics(title, artist, lyrics)
        }
      });

      onProgress?.({
        type: 'success',
        message: `Created song "${title}" by "${artist}" with lyrics`,
        date,
        song: { title, artist }
      });

      return song;
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        `Failed to create/get song "${title}" by "${artist}": ${error.message}` :
        `Failed to create/get song "${title}" by "${artist}": Unknown error`;

      onProgress?.({
        type: 'error',
        message: errorMessage,
        date,
        song: title && artist ? { title, artist } : undefined
      });

      if (error instanceof SongError) {
        throw error;
      }
      throw new SongError(errorMessage, 'INTERNAL_ERROR');
    }
  }
}

// Export factory function
export function createSongService() {
  return new SongService(prisma);
} 