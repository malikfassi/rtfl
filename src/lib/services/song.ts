import { prisma } from '@/lib/db';
import { geniusClient } from '@/lib/clients/genius';
import { spotifyClient } from '@/lib/clients/spotify';
import { Song, Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import type { SpotifyTrack } from '@/types/spotify';

export class SongError extends Error {
  constructor(
    message: string,
    public code: 'INTERNAL_ERROR' | 'GENIUS_NOT_FOUND' | 'SPOTIFY_NOT_FOUND' | 'INVALID_INPUT'
  ) {
    super(message);
    this.name = 'SongError';
  }
}

interface GeniusData {
  id: number;
  title: string;
  artist_names: string;
  url: string;
}

interface GeniusResult {
  lyrics: string;
  data: GeniusData;
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

  private createMaskedLyrics(title: string, artist: string, lyrics: string): Prisma.JsonObject {
    return {
      title: this.splitPreservingNewlines(title).map(word => this.maskWord(word)),
      artist: this.splitPreservingNewlines(artist).map(word => this.maskWord(word)),
      lyrics: this.splitPreservingNewlines(lyrics).map(word => this.maskWord(word))
    };
  }

  async create(spotifyId: string): Promise<Song> {
    try {
      // Fetch track data from Spotify
      const rawTrackData = await spotifyClient.getTrack(spotifyId);
      if (!rawTrackData) {
        throw new SongError(
          `Track not found: ${spotifyId}`,
          'SPOTIFY_NOT_FOUND'
        );
      }

      const spotifyTrackData = rawTrackData as SpotifyTrack;
      const title = spotifyTrackData.name;
      const artist = spotifyTrackData.artists[0].name;

      // Get lyrics from Genius
      let lyrics: string;
      let geniusData: GeniusData;
      try {
        const rawGeniusResult = await geniusClient.searchSong(title, artist);
        const geniusResult = rawGeniusResult as unknown as GeniusResult;
        
        if (!geniusResult.lyrics || !geniusResult.data) {
          throw new SongError(
            `No lyrics found for "${title}" by "${artist}"`,
            'GENIUS_NOT_FOUND'
          );
        }
        
        lyrics = geniusResult.lyrics;
        geniusData = geniusResult.data;
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = error.name === 'GeniusError' ? 
            `No lyrics found for "${title}" by "${artist}"` :
            `Failed to fetch lyrics for "${title}" by "${artist}" - ${error.message}`;
          throw new SongError(errorMessage, 'GENIUS_NOT_FOUND');
        }
        throw error;
      }

      // Create song with lyrics
      return await this.prisma.song.create({
        data: {
          spotifyId,
          spotifyData: JSON.parse(JSON.stringify(spotifyTrackData)) as Prisma.InputJsonValue,
          geniusData: JSON.parse(JSON.stringify(geniusData)) as Prisma.InputJsonValue,
          lyrics,
          maskedLyrics: this.createMaskedLyrics(title, artist, lyrics)
        }
      });
    } catch (error) {
      if (error instanceof SongError) {
        throw error;
      }
      throw new SongError(
        error instanceof Error ? 
          `Failed to create song: ${error.message}` :
          'Failed to create song: Unknown error',
        'INTERNAL_ERROR'
      );
    }
  }
}

// Export factory function
export function createSongService() {
  return new SongService(prisma);
} 