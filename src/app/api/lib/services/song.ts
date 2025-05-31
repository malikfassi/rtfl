import type { PrismaClient, Song, Prisma } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';

import { prisma } from '@/app/api/lib/db';
import { validateSchema } from '@/app/api/lib/validation';
import { spotifyIdSchema } from '@/app/api/lib/validation';
import type { GeniusHit, GeniusServiceInterface } from '@/app/api/lib/types/genius';
import type { SpotifyServiceInterface } from '@/app/api/lib/types/spotify';
import { extractTrackData } from '@/app/api/lib/utils/spotify';
import { extractGeniusData } from '@/app/api/lib/utils/genius';
import { geniusService } from './genius';
import { lyricsService } from './lyrics';
import { maskedLyricsService } from './masked-lyrics';
import { spotifyService } from './spotify';

export class SongService {
  constructor(
    private prisma: PrismaClient,
    private spotifyService: SpotifyServiceInterface,
    private geniusService: GeniusServiceInterface
  ) {}

  /**
   * Idempotently create a song for the given Spotify ID.
   * If a song with the given Spotify ID already exists, it is returned.
   * Otherwise, fetches data from Spotify/Genius and creates the song.
   */
  async create(spotifyId: string, tx?: PrismaClient): Promise<Song> {
    const validatedId = validateSchema(spotifyIdSchema, spotifyId);

    // Check if the song already exists
    const prisma = tx || this.prisma;
    const existingSong = await prisma.song.findFirst({ where: { spotifyId: validatedId } });
    if (existingSong) {
      return existingSong;
    }

    // First, fetch all external data
    const [track, bestMatch, lyrics] = await this.fetchExternalData(validatedId);

    // Then, create the song in the database
    return await this.createSongInDb(validatedId, track, bestMatch, lyrics, prisma);
  }

  /**
   * Fetch a song by Spotify ID, or return null if not found.
   */
  async getBySpotifyId(spotifyId: string, tx?: PrismaClient): Promise<Song | null> {
    const validatedId = validateSchema(spotifyIdSchema, spotifyId);
    const prisma = tx || this.prisma;
    return prisma.song.findFirst({ where: { spotifyId: validatedId } });
  }

  private async fetchExternalData(spotifyId: string): Promise<[Track, GeniusHit, string]> {
    // 1. Get Spotify track data
    const track = await this.spotifyService.getTrack(spotifyId);

    // 2. Search Genius with Spotify track info
    console.log('Searching Genius for:', { 
      title: track.name,
      artist: track.artists[0].name
    });
    
    const bestMatch = await this.geniusService.findMatch(track.name, track.artists[0].name);

    if (!bestMatch.result.primary_artist) {
      throw new Error('Genius result is missing primary_artist');
    }
    if (!bestMatch.result.url) {
      throw new Error('Genius result is missing url for lyrics');
    }
    console.log('Found lyrics:', {
      title: bestMatch.result.title,
      artist: bestMatch.result.primary_artist.name,
      url: bestMatch.result.url
    });

    // 3. Get lyrics from the best match URL
    const lyrics = await lyricsService.getLyrics(bestMatch.result.url);

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
    const maskedLyrics = maskedLyricsService.create(
      track.name,
      track.artists[0].name,
      lyrics
    );

    // 2. Store only essential external data
    const spotifyData = extractTrackData(track);
    const geniusData = extractGeniusData(bestMatch);

    // 3. Create song record
    return await tx.song.create({
      data: {
        spotifyId,
        spotifyData: spotifyData as unknown as Prisma.InputJsonValue,
        geniusData: geniusData as unknown as Prisma.InputJsonValue,
        lyrics,
        maskedLyrics: maskedLyrics as unknown as Prisma.InputJsonValue
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