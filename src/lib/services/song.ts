import { prisma } from '@/lib/db';
import { getGeniusClient, type GeniusClient } from '@/lib/clients/genius';
import { getSpotifyClient, type SpotifyClient } from '@/lib/clients/spotify';
import { PrismaClient, Prisma, Song } from '@prisma/client';
import { lyricsService } from './lyrics';
import type { Track } from '@spotify/web-api-ts-sdk';
import { NoMatchingLyricsError } from '@/lib/errors/genius';
import { NoMatchingTracksError } from '@/lib/errors/spotify';
import { validateSchema } from '@/lib/validation';
import { spotifyIdSchema, searchQuerySchema } from '@/lib/validation';
import { GeniusSearchResponse } from '@/types/genius';
import { constructGeniusSearchQuery } from '@/lib/utils/genius';

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
      const [track, geniusSearchResult, lyrics] = await this.fetchExternalData(validatedId);

      // Then, create the song in the database
      const prisma = tx || this.prisma;
      return await this.createSongInDb(validatedId, track, geniusSearchResult, lyrics, prisma);
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
    try {
      return await this.spotifyClient.searchTracks(validatedQuery);
    } catch (error) {
      if (error instanceof NoMatchingTracksError) {
        return [];
      }
      throw error;
    }
  }

  private async fetchExternalData(spotifyId: string): Promise<[Track, GeniusSearchResponse, string]> {
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
    console.log('Genius search results:', geniusSearchResult.response.hits.map(hit => ({
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      url: hit.result.url
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

    return [track, geniusSearchResult, lyrics];
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
    const exactMatch = hits.find(hit => {
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
    const partialMatch = hits.find(hit => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      return (hitTitle.includes(normalizedTitle) || normalizedTitle.includes(hitTitle)) 
        && hitArtist === normalizedArtist;
    });

    if (partialMatch) {
      return partialMatch;
    }

    // Try fuzzy match - if artist matches exactly and title has significant overlap
    const fuzzyMatch = hits.find(hit => {
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
    geniusSearchResult: GeniusSearchResponse,
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

    const geniusData = JSON.parse(JSON.stringify({
      url: geniusSearchResult.response.hits[0]?.result.url,
      title: geniusSearchResult.response.hits[0]?.result.title,
      artist: geniusSearchResult.response.hits[0]?.result.primary_artist.name
    })) as Prisma.InputJsonValue;

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