import { Prisma, PrismaClient, Song } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';

import { type GeniusClient,getGeniusClient } from '@/app/api/lib/clients/genius';
import { getSpotifyClient, type SpotifyClient } from '@/app/api/lib/clients/spotify';
import { prisma } from '@/app/api/lib/db';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/genius';
import { NoMatchingTracksError } from '@/app/api/lib/errors/spotify';
import { constructGeniusSearchQuery } from '@/app/api/lib/utils/genius';
import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema,spotifyIdSchema } from '@/app/api/lib/validation';
import { GeniusSearchResponse } from '@/app/types/genius';

import { lyricsService } from './lyrics';

interface GeniusHit {
  result: {
    title: string;
    url: string;
    primary_artist: {
      name: string;
    };
  };
}

export class SongService {
  constructor(
    private prisma: PrismaClient,
    private spotifyClient: SpotifyClient,
    private geniusClient: GeniusClient
  ) {}

  async create(spotifyId: string, tx?: Prisma.TransactionClient): Promise<Song> {
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

  async getTrack(id: string): Promise<Track> {
    const validatedId = validateSchema(spotifyIdSchema, id);
    return await this.spotifyClient.getTrack(validatedId);
  }

  async searchTracks(query: string): Promise<Track[]> {
    const validatedQuery = validateSchema(searchQuerySchema, query);
    return await this.spotifyClient.searchTracks(validatedQuery);
  }

  private async fetchExternalData(spotifyId: string): Promise<[Track, GeniusHit, string]> {
    // 1. Get Spotify track data
    const track = await this.getTrack(spotifyId);

    // 2. Search Genius with Spotify track info
    const searchQuery = constructGeniusSearchQuery(track.name, track.artists[0].name);
    console.log('Searching Genius for:', { 
      originalTitle: track.name,
      originalArtist: track.artists[0].name,
      searchQuery 
    });
    
    const geniusSearchResult = await this.geniusClient.search(searchQuery);
    if (!geniusSearchResult.response.hits.length) {
      throw new NoMatchingLyricsError();
    }

    // Log all hits for debugging
    console.log('Genius search results:', geniusSearchResult.response.hits.map((hit: GeniusHit) => ({
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
    })));

    // Find best match by comparing title and artist
    const bestMatch = this.findBestMatch(
      track.name,
      track.artists[0].name,
      geniusSearchResult.response.hits
    );

    if (!bestMatch) {
      throw new NoMatchingLyricsError();
    }

    console.log('Selected match:', {
      title: bestMatch.result.title,
      artist: bestMatch.result.primary_artist.name,
      url: bestMatch.result.url
    });

    // 3. Get lyrics from the best match URL
    const lyrics = await this.geniusClient.getLyrics(bestMatch.result.url);
    if (!lyrics) {
      throw new NoMatchingLyricsError();
    }

    return [track, bestMatch, lyrics];
  }

  private findBestMatch(
    spotifyTitle: string,
    spotifyArtist: string,
    hits: GeniusSearchResponse['response']['hits']
  ) {
    // Normalize strings for comparison - keep it simple!
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')                      // Normalize whitespace
      .trim();

    const normalizedTitle = normalize(spotifyTitle);
    const normalizedArtist = normalize(spotifyArtist);

    console.log('Normalized search:', {
      title: normalizedTitle,
      artist: normalizedArtist
    });

    // Find exact match first
    const exactMatch = hits.find((hit: GeniusHit) => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      console.log('Comparing with:', {
        title: hitTitle,
        artist: hitArtist
      });
      return hitTitle === normalizedTitle && hitArtist === normalizedArtist;
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Find partial match - title must contain our title and artist must match
    const partialMatch = hits.find((hit: GeniusHit) => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      return (hitTitle.includes(normalizedTitle) || normalizedTitle.includes(hitTitle)) 
        && hitArtist === normalizedArtist;
    });

    if (partialMatch) {
      return partialMatch;
    }

    // Try fuzzy match - if artist matches exactly and title has significant overlap
    const fuzzyMatch = hits.find((hit: GeniusHit) => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      
      // Artist must match
      if (hitArtist !== normalizedArtist) return false;
      
      // Check if most words from one title appear in the other
      const titleWords = normalizedTitle.split(' ');
      const hitWords = hitTitle.split(' ');
      const commonWords = titleWords.filter(word => hitWords.includes(word));
      
      return commonWords.length >= Math.min(titleWords.length, hitWords.length) * 0.5;
    });

    return fuzzyMatch || null;
  }

  private async createSongInDb(
    spotifyId: string, 
    track: Track, 
    bestMatch: GeniusHit,
    lyrics: string, 
    tx?: Prisma.TransactionClient
  ): Promise<Song> {
    const prisma = tx || this.prisma;

    // 1. Prepare masked lyrics
    const maskedLyrics = {
      title: lyricsService.mask(track.name),
      artist: lyricsService.mask(track.artists[0].name),
      lyrics: lyricsService.mask(lyrics)
    } as Prisma.InputJsonValue;

    // 2. Store only essential external data
    const spotifyData = JSON.parse(JSON.stringify({
      name: track.name,
      artists: track.artists.map(a => ({ name: a.name, id: a.id })),
      album: {
        name: track.album.name,
        images: track.album.images
      },
      preview_url: track.preview_url
    })) as Prisma.InputJsonValue;

    const geniusData = {
      url: bestMatch.result.url,
      title: bestMatch.result.title,
      artist: bestMatch.result.primary_artist.name
    } as Prisma.InputJsonValue;

    // 3. Create song record
    return await prisma.song.create({
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