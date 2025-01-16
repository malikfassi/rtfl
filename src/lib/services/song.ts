import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { spotifyClient } from '../clients/spotify';
import { geniusClient } from '../clients/genius';
import { lyricsService } from './lyrics';

export class SongError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SongError';
  }
}

export class SongService {
  async getOrCreate(spotifyId: string) {
    try {
      // Try to find existing song
      const existingSong = await prisma.song.findUnique({
        where: { spotifyId },
      });

      if (existingSong) {
        return existingSong;
      }

      // Get track details from Spotify
      const playlist = await spotifyClient.getPlaylistTracks(spotifyId);
      const track = playlist.tracks[0];
      if (!track) {
        throw new SongError('Track not found on Spotify', 'SPOTIFY_NOT_FOUND');
      }

      const title = track.name;
      const artist = track.artists[0]?.name;
      if (!artist) {
        throw new SongError('Artist not found for track', 'SPOTIFY_NOT_FOUND');
      }

      // Get lyrics from Genius
      const lyrics = await geniusClient.searchSong(title, artist);
      if (!lyrics) {
        throw new SongError(
          `Lyrics not found for ${title} by ${artist}`,
          'GENIUS_NOT_FOUND'
        );
      }

      // Generate masked lyrics and convert to JSON object
      const masked = lyricsService.maskSong(title, artist, lyrics);
      const maskedLyrics: Prisma.JsonObject = {
        title: masked.title,
        artist: masked.artist,
        lyrics: masked.lyrics,
      };

      // Create new song
      return await prisma.song.create({
        data: {
          spotifyId,
          title,
          artist,
          previewUrl: track.preview_url || null,
          lyrics,
          maskedLyrics,
        },
      });
    } catch (error) {
      if (error instanceof SongError) {
        throw error;
      }
      throw new SongError(
        'Failed to create song: ' + (error as Error).message,
        'INTERNAL_ERROR'
      );
    }
  }
}

// Export factory function
export function createSongService() {
  return new SongService();
} 