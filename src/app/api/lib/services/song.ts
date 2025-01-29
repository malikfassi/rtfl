import type { PrismaClient, Song } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';

import { prisma } from '@/app/api/lib/db';
import { NoMatchingTracksError } from '@/app/api/lib/errors/services/spotify';
import { validateSchema } from '@/app/api/lib/validation';
import { spotifyIdSchema } from '@/app/api/lib/validation';
import type { GeniusHit } from '@/app/types/genius';
import { geniusService } from './genius';
import { lyricsService } from './lyrics';
import { spotifyService } from './spotify';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface SpotifyServiceInterface {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
}

export interface GeniusServiceInterface {
  findLyrics(title: string, artist: string): Promise<GeniusHit>;
  getLyrics(url: string): Promise<string>;
}

export class SongService {
  constructor(
    private prisma: PrismaClient,
    private spotifyService: SpotifyServiceInterface,
    private geniusService: GeniusServiceInterface
  ) {}

  async create(spotifyId: string, tx?: PrismaClient): Promise<Song> {
    const validatedId = validateSchema(spotifyIdSchema, spotifyId);

    try {
      // First, fetch all external data
      const [track, bestMatch, lyrics] = await this.fetchExternalData(validatedId);

      // Then, create the song in the database
      const prisma = tx || this.prisma;
      return await this.createSongInDb(validatedId, track, bestMatch, lyrics, prisma);
    } catch (error) {
      if (error instanceof NoMatchingTracksError) {
        throw new Error('Track not found');
      }
      throw error;
    }
  }

  private async fetchExternalData(spotifyId: string): Promise<[Track, GeniusHit, string]> {
    // 1. Get Spotify track data
    const track = await this.spotifyService.getTrack(spotifyId);

    // 2. Search Genius with Spotify track info
    console.log('Searching Genius for:', { 
      title: track.name,
      artist: track.artists[0].name
    });
    
    const bestMatch = await this.geniusService.findLyrics(track.name, track.artists[0].name);

    console.log('Found lyrics:', {
      title: bestMatch.result.title,
      artist: bestMatch.result.primary_artist.name,
      url: bestMatch.result.url
    });

    // 3. Get lyrics from the best match URL
    const lyrics = await this.geniusService.getLyrics(bestMatch.result.url);

    return [track, bestMatch, lyrics];
  }

  private async createSongInDb(
    spotifyId: string, 
    track: Track, 
    bestMatch: GeniusHit,
    lyrics: string, 
    tx: PrismaClient
  ): Promise<Song> {
    // 1. Prepare masked lyrics
    const maskedLyrics = {
      title: lyricsService.mask(track.name),
      artist: lyricsService.mask(track.artists[0].name),
      lyrics: lyricsService.mask(lyrics)
    } as JsonValue;

    // 2. Store only essential external data
    const spotifyData = JSON.parse(JSON.stringify({
      name: track.name,
      artists: track.artists.map(a => ({ name: a.name, id: a.id })),
      album: {
        name: track.album.name,
        images: track.album.images
      },
      preview_url: track.preview_url
    })) as JsonValue;

    const geniusData = {
      url: bestMatch.result.url,
      title: bestMatch.result.title,
      artist: bestMatch.result.primary_artist.name
    } as JsonValue;

    // 3. Create song record
    return await tx.song.create({
      data: {
        spotifyId,
        spotifyData,
        geniusData,
        lyrics,
        maskedLyrics
      }
    });
  }
}

// Default instance using default dependencies
export const songService = new SongService(
  prisma,
  spotifyService,
  geniusService
);

// Factory function to create new instances with custom dependencies
export const createSongService = (
  prismaClient: PrismaClient = prisma,
  spotifyServiceInstance: typeof spotifyService = spotifyService,
  geniusServiceInstance: typeof geniusService = geniusService
) => {
  return new SongService(prismaClient, spotifyServiceInstance, geniusServiceInstance);
}; 