import { PrismaClient } from '@prisma/client';
import { subHours } from 'date-fns';
import { CacheService } from './cache';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    cachedSpotifyTrack: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
      upsert: jest.fn().mockImplementation(() => Promise.resolve(null)),
    },
    cachedSpotifyPlaylist: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
      upsert: jest.fn().mockImplementation(() => Promise.resolve(null)),
    },
    cachedGeniusLyrics: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
      upsert: jest.fn().mockImplementation(() => Promise.resolve(null)),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Get the mock instance
const getMockPrisma = () => new PrismaClient();

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockPrisma: ReturnType<typeof getMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService();
    mockPrisma = getMockPrisma();
  });

  describe('Track caching', () => {
    const mockTrack = {
      id: 'track1',
      name: 'Test Track',
      artist: 'Test Artist',
      previewUrl: 'http://example.com/preview',
    };

    it('returns null for cache miss', async () => {
      (mockPrisma.cachedSpotifyTrack.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await cacheService.getTrack('track1');
      expect(result).toBeNull();
    });

    it('returns track for valid cache hit', async () => {
      (mockPrisma.cachedSpotifyTrack.findUnique as jest.Mock).mockResolvedValue({
        spotifyId: 'track1',
        data: JSON.stringify(mockTrack),
        updatedAt: new Date(),
      });

      const result = await cacheService.getTrack('track1');
      expect(result).toEqual(mockTrack);
    });

    it('returns null for expired cache', async () => {
      (mockPrisma.cachedSpotifyTrack.findUnique as jest.Mock).mockResolvedValue({
        spotifyId: 'track1',
        data: JSON.stringify(mockTrack),
        updatedAt: subHours(new Date(), 25), // 25 hours old
      });

      const result = await cacheService.getTrack('track1');
      expect(result).toBeNull();
    });

    it('stores track in cache', async () => {
      await cacheService.setTrack('track1', mockTrack);

      expect(mockPrisma.cachedSpotifyTrack.upsert).toHaveBeenCalledWith({
        where: { spotifyId: 'track1' },
        create: {
          spotifyId: 'track1',
          data: JSON.stringify(mockTrack),
        },
        update: {
          data: JSON.stringify(mockTrack),
        },
      });
    });
  });

  describe('Playlist caching', () => {
    const mockPlaylist = {
      id: 'playlist1',
      name: 'Test Playlist',
      tracks: [
        {
          id: 'track1',
          name: 'Test Track',
          artist: 'Test Artist',
          previewUrl: 'http://example.com/preview',
        },
      ],
    };

    it('returns null for cache miss', async () => {
      (mockPrisma.cachedSpotifyPlaylist.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await cacheService.getPlaylist('playlist1');
      expect(result).toBeNull();
    });

    it('returns playlist for valid cache hit', async () => {
      (mockPrisma.cachedSpotifyPlaylist.findUnique as jest.Mock).mockResolvedValue({
        spotifyId: 'playlist1',
        data: JSON.stringify(mockPlaylist),
        updatedAt: new Date(),
      });

      const result = await cacheService.getPlaylist('playlist1');
      expect(result).toEqual(mockPlaylist);
    });

    it('returns null for expired cache', async () => {
      (mockPrisma.cachedSpotifyPlaylist.findUnique as jest.Mock).mockResolvedValue({
        spotifyId: 'playlist1',
        data: JSON.stringify(mockPlaylist),
        updatedAt: subHours(new Date(), 25), // 25 hours old
      });

      const result = await cacheService.getPlaylist('playlist1');
      expect(result).toBeNull();
    });

    it('stores playlist in cache', async () => {
      await cacheService.setPlaylist('playlist1', mockPlaylist);

      expect(mockPrisma.cachedSpotifyPlaylist.upsert).toHaveBeenCalledWith({
        where: { spotifyId: 'playlist1' },
        create: {
          spotifyId: 'playlist1',
          data: JSON.stringify(mockPlaylist),
        },
        update: {
          data: JSON.stringify(mockPlaylist),
        },
      });
    });
  });

  describe('Lyrics caching', () => {
    const mockLyrics = {
      lyrics: 'Test lyrics',
      spotifyId: 'track1',
    };

    it('returns null for cache miss', async () => {
      (mockPrisma.cachedGeniusLyrics.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await cacheService.getLyrics('genius1');
      expect(result).toBeNull();
    });

    it('returns lyrics for cache hit', async () => {
      (mockPrisma.cachedGeniusLyrics.findUnique as jest.Mock).mockResolvedValue({
        geniusId: 'genius1',
        spotifyId: 'track1',
        lyrics: 'Test lyrics',
        updatedAt: new Date(),
      });

      const result = await cacheService.getLyrics('genius1');
      expect(result).toEqual(mockLyrics);
    });

    it('stores lyrics in cache', async () => {
      await cacheService.setLyrics('genius1', mockLyrics);

      expect(mockPrisma.cachedGeniusLyrics.upsert).toHaveBeenCalledWith({
        where: { geniusId: 'genius1' },
        create: {
          geniusId: 'genius1',
          spotifyId: mockLyrics.spotifyId,
          lyrics: mockLyrics.lyrics,
        },
        update: {
          spotifyId: mockLyrics.spotifyId,
          lyrics: mockLyrics.lyrics,
        },
      });
    });

    it('retrieves lyrics by Spotify ID', async () => {
      (mockPrisma.cachedGeniusLyrics.findUnique as jest.Mock).mockResolvedValue({
        geniusId: 'genius1',
        spotifyId: 'track1',
        lyrics: 'Test lyrics',
        updatedAt: new Date(),
      });

      const result = await cacheService.getLyricsBySpotifyId('track1');
      expect(result).toBe('Test lyrics');
    });
  });
});
