import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET, POST, PUT } from './route';

// Mock CacheService class
const mockGetPlaylist = jest.fn();
const mockGetLyricsBySpotifyId = jest.fn();

jest.mock('@/lib/cache', () => {
  return {
    CacheService: jest.fn().mockImplementation(() => ({
      getPlaylist: mockGetPlaylist,
      getLyricsBySpotifyId: mockGetLyricsBySpotifyId,
    })),
  };
});

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Admin Games API', () => {
  const mockDate = '2025-01-11';
  const mockPlaylistId = 'playlist123';
  const mockGame = {
    id: 'game123',
    date: new Date(mockDate),
    playlistId: mockPlaylistId,
    overrideSongId: null,
    randomSeed: 'seed123',
    createdAt: new Date(),
    updatedAt: new Date(),
    guesses: [],
  };

  const mockPlaylist = {
    id: mockPlaylistId,
    name: 'Test Playlist',
    tracks: [
      {
        id: 'track123',
        name: 'Test Track',
        artist: 'Test Artist',
        previewUrl: 'https://example.com/preview',
        albumCover: 'https://example.com/cover.jpg',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/games/[date]', () => {
    it('should return game data', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);
      mockGetPlaylist.mockResolvedValue(mockPlaylist);
      mockGetLyricsBySpotifyId.mockResolvedValue('Test lyrics');

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${mockDate}`),
      );
      const response = await GET(request, { params: { date: mockDate } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockGame.id);
      expect(data.playlist.id).toBe(mockPlaylist.id);
      expect(data.selectedTrack).toBeDefined();
      expect(data.lyrics).toBe('Test lyrics');
    });

    it('should handle invalid date format', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/games/invalid-date'),
      );
      const response = await GET(request, { params: { date: 'invalid-date' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('should handle game not found', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${mockDate}`),
      );
      const response = await GET(request, { params: { date: mockDate } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found for this date');
    });
  });

  describe('POST /api/admin/games/[date]', () => {
    const mockCreateBody = {
      playlistId: mockPlaylistId,
      randomSeed: 'seed123',
    };

    it('should create a new game', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${mockDate}`),
        {
          method: 'POST',
          body: JSON.stringify(mockCreateBody),
        },
      );
      const response = await POST(request, { params: { date: mockDate } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockGame.id);
      expect(prisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: expect.any(Date),
          playlistId: mockPlaylistId,
        }),
      });
    });

    it('should handle invalid date format', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/games/invalid-date'),
        {
          method: 'POST',
          body: JSON.stringify(mockCreateBody),
        },
      );
      const response = await POST(request, { params: { date: 'invalid-date' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('should handle existing game', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${mockDate}`),
        {
          method: 'POST',
          body: JSON.stringify(mockCreateBody),
        },
      );
      const response = await POST(request, { params: { date: mockDate } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Game already exists for this date');
    });
  });

  describe('PUT /api/admin/games/[date]', () => {
    const mockUpdateBody = {
      playlistId: 'new-playlist-123',
    };

    it('should update an existing game', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue({
        ...mockGame,
        playlistId: mockUpdateBody.playlistId,
      });

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${mockDate}`),
        {
          method: 'PUT',
          body: JSON.stringify(mockUpdateBody),
        },
      );
      const response = await PUT(request, { params: { date: mockDate } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.playlistId).toBe(mockUpdateBody.playlistId);
    });

    it('should handle game not found', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${mockDate}`),
        {
          method: 'PUT',
          body: JSON.stringify(mockUpdateBody),
        },
      );
      const response = await PUT(request, { params: { date: mockDate } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found for this date');
    });
  });
}); 