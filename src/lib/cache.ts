import { PrismaClient } from '@prisma/client';
import { addHours, isBefore } from 'date-fns';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for cached data validation
const CachedTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  previewUrl: z.string().nullable(),
});

const CachedPlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  tracks: z.array(CachedTrackSchema),
});

const CachedLyricsSchema = z.object({
  lyrics: z.string(),
  spotifyId: z.string(),
});

type CachedTrack = z.infer<typeof CachedTrackSchema>;
type CachedPlaylist = z.infer<typeof CachedPlaylistSchema>;
type CachedLyrics = z.infer<typeof CachedLyricsSchema>;

export class CacheService {
  private static TRACK_EXPIRY_HOURS = 24;
  private static PLAYLIST_EXPIRY_HOURS = 24;

  // Track caching
  async getTrack(spotifyId: string): Promise<CachedTrack | null> {
    const cached = await prisma.cachedSpotifyTrack.findUnique({
      where: { spotifyId },
    });

    if (!cached) return null;

    // Check expiry
    if (isBefore(addHours(cached.updatedAt, CacheService.TRACK_EXPIRY_HOURS), new Date())) {
      return null;
    }

    try {
      return CachedTrackSchema.parse(JSON.parse(cached.data));
    } catch (error) {
      console.error('Failed to parse cached track:', error);
      return null;
    }
  }

  async setTrack(spotifyId: string, track: CachedTrack): Promise<void> {
    await prisma.cachedSpotifyTrack.upsert({
      where: { spotifyId },
      create: {
        spotifyId,
        data: JSON.stringify(track),
      },
      update: {
        data: JSON.stringify(track),
      },
    });
  }

  // Playlist caching
  async getPlaylist(spotifyId: string): Promise<CachedPlaylist | null> {
    const cached = await prisma.cachedSpotifyPlaylist.findUnique({
      where: { spotifyId },
    });

    if (!cached) return null;

    // Check expiry
    if (isBefore(addHours(cached.updatedAt, CacheService.PLAYLIST_EXPIRY_HOURS), new Date())) {
      return null;
    }

    try {
      return CachedPlaylistSchema.parse(JSON.parse(cached.data));
    } catch (error) {
      console.error('Failed to parse cached playlist:', error);
      return null;
    }
  }

  async setPlaylist(spotifyId: string, playlist: CachedPlaylist): Promise<void> {
    await prisma.cachedSpotifyPlaylist.upsert({
      where: { spotifyId },
      create: {
        spotifyId,
        data: JSON.stringify(playlist),
      },
      update: {
        data: JSON.stringify(playlist),
      },
    });
  }

  // Lyrics caching (no expiry)
  async getLyrics(geniusId: string): Promise<CachedLyrics | null> {
    const cached = await prisma.cachedGeniusLyrics.findUnique({
      where: { geniusId },
    });

    if (!cached) return null;

    try {
      return CachedLyricsSchema.parse({
        lyrics: cached.lyrics,
        spotifyId: cached.spotifyId,
      });
    } catch (error) {
      console.error('Failed to parse cached lyrics:', error);
      return null;
    }
  }

  async setLyrics(geniusId: string, lyrics: CachedLyrics): Promise<void> {
    await prisma.cachedGeniusLyrics.upsert({
      where: { geniusId },
      create: {
        geniusId,
        spotifyId: lyrics.spotifyId,
        lyrics: lyrics.lyrics,
      },
      update: {
        spotifyId: lyrics.spotifyId,
        lyrics: lyrics.lyrics,
      },
    });
  }

  // Helper to get lyrics by Spotify ID
  async getLyricsBySpotifyId(spotifyId: string): Promise<string | null> {
    const cached = await prisma.cachedGeniusLyrics.findUnique({
      where: { spotifyId },
    });

    return cached?.lyrics ?? null;
  }
}
