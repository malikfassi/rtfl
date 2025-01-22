import { prisma } from '@/lib/db';
import { getGeniusClient, type GeniusClient } from '@/lib/clients/genius';
import { getSpotifyClient, type SpotifyClient } from '@/lib/clients/spotify';
import { PrismaClient, Prisma, Song } from '@prisma/client';
import { lyricsService } from './lyrics';
import type { Track } from '@spotify/web-api-ts-sdk';
import { ValidationError } from '@/lib/errors/base';
import { 
  SongNotFoundError,
  InvalidTrackIdError,
  NoLyricsFoundError
} from '@/lib/errors/song';

export class SongService {
  constructor(
    private prisma: PrismaClient,
    private spotifyClient: SpotifyClient,
    private geniusClient: GeniusClient
  ) {}

  async create(spotifyId: string, tx?: Prisma.TransactionClient): Promise<Song> {
    if (!spotifyId?.trim()) {
      throw new ValidationError('Spotify ID is required');
    }

    try {
      // First, fetch all external data
      const [track, lyrics] = await this.fetchExternalData(spotifyId);

      // Then, create the song in the database
      return await this.createSongInDb(spotifyId, track, lyrics, tx);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Genius API error')) {
        throw new NoLyricsFoundError();
      }
      throw error;
    }
  }

  async getTrack(id: string): Promise<Track> {
    if (!id.trim()) {
      throw new ValidationError('Spotify ID is required');
    }

    try {
      return await this.spotifyClient.getTrack(id);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Track not found')) {
          throw new SongNotFoundError();
        }
        if (error.message.includes('Invalid track ID')) {
          throw new InvalidTrackIdError(id);
        }
      }
      throw error;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    if (!query.trim()) {
      throw new ValidationError('Search query is required');
    }

    return this.spotifyClient.searchTracks(query);
  }

  async searchLyrics(query: string): Promise<string | null> {
    const result = await this.geniusClient.search(query);
    if (!result.response.hits.length) {
      return null;
    }

    return this.geniusClient.searchSong(query, '');
  }

  private async fetchExternalData(spotifyId: string): Promise<[Track, string | null]> {
    const track = await this.spotifyClient.getTrack(spotifyId);

    const searchQuery = `${track.name} ${track.artists[0].name}`;
    const searchResult = await this.geniusClient.search(searchQuery);
    if (!searchResult.response.hits.length) {
      return [track, null];
    }

    const lyrics = await this.geniusClient.searchSong(track.name, track.artists[0].name);
    return [track, lyrics];
  }

  private async createSongInDb(
    spotifyId: string, 
    track: Track, 
    lyrics: string | null, 
    tx?: Prisma.TransactionClient
  ): Promise<Song> {
    const prisma = tx || this.prisma;
    const title = track.name;
    const artist = track.artists[0].name;

    const maskedLyrics = {
      title: lyricsService.mask(title),
      artist: lyricsService.mask(artist),
      lyrics: lyrics ? lyricsService.mask(lyrics) : []
    };

    const spotifyData = JSON.parse(JSON.stringify(track)) as Prisma.InputJsonValue;
    const searchQuery = `${title} ${artist}`;
    const geniusData = JSON.parse(JSON.stringify({
      search: await this.geniusClient.search(searchQuery)
    })) as Prisma.InputJsonValue;

    return await prisma.song.create({
      data: {
        spotifyId,
        spotifyData,
        geniusData,
        lyrics: lyrics || '',
        maskedLyrics
      }
    });
  }

  async getSongWithLyrics(spotifyId: string): Promise<{ track: Track; lyrics: string | null }> {
    if (!spotifyId?.trim()) {
      throw new ValidationError('Spotify ID is required');
    }

    const track = await this.spotifyClient.getTrack(spotifyId);

    const searchQuery = `${track.name} ${track.artists[0].name}`;
    const searchResult = await this.geniusClient.search(searchQuery);
    if (!searchResult.response.hits.length) {
      return { track, lyrics: null };
    }

    const lyrics = await this.geniusClient.searchSong(track.name, track.artists[0].name);
    return { track, lyrics };
  }
}

// Default instance using default dependencies
export const songService = new SongService(
  prisma,
  getSpotifyClient(),
  getGeniusClient()
);

// Factory function to create new instances with custom dependencies
export const createSongService = (
  prismaClient: PrismaClient = prisma,
  spotifyClient: SpotifyClient = getSpotifyClient(),
  geniusClient: GeniusClient = getGeniusClient()
) => {
  return new SongService(prismaClient, spotifyClient, geniusClient);
}; 