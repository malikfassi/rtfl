import { GET, POST, PUT } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock CacheService
const mockGetPlaylist = jest.fn();
const mockGetLyricsBySpotifyId = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    getPlaylist: mockGetPlaylist,
    getLyricsBySpotifyId: mockGetLyricsBySpotifyId,
  })),
}));

describe('Admin Games API', () => {
  const mockDate = '2024-01-01';
  const mockGame = {
    id: '1',
    date: new Date(mockDate),
    playlistId: 'playlist123',
    randomSeed: 'seed123',
    overrideSongId: null,
  };

  const mockPlaylist = {
    id: 'playlist123',
    name: 'Test Playlist',
    tracks: [
      {
        id: 'track123',
        name: 'Test Track',
        artists: ['Test Artist'],
        previewUrl: 'https://example.com/preview',
      },
    ],
  };

  const mockLyrics = {
    id: 'lyrics123',
    text: 'Test lyrics',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return game data when found', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);
      mockGetPlaylist.mockResolvedValue(mockPlaylist);
      mockGetLyricsBySpotifyId.mockResolvedValue(mockLyrics);

      const request = new NextRequest('http://localhost:3000');
      const response = await GET(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        ...mockGame,
        date: mockGame.date.toISOString(),
        playlist: mockPlaylist,
        selectedTrack: mockPlaylist.tracks[0],
        lyrics: mockLyrics,
      });
    });

    it('should return 404 when game not found', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000');
      const response = await GET(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Game not found for this date' });
    });

    it('should return 400 for invalid date format', async () => {
      const request = new NextRequest('http://localhost:3000');
      const response = await GET(request, { params: Promise.resolve({ date: 'invalid-date' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });
  });

  describe('POST', () => {
    const mockBody = {
      playlistId: 'playlist123',
      randomSeed: 'seed123',
    };

    it('should create a new game', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(mockBody),
      });
      const response = await POST(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        ...mockGame,
        date: mockGame.date.toISOString(),
      });
    });

    it('should return 409 when game already exists', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(mockBody),
      });
      const response = await POST(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({ error: 'Game already exists for this date' });
    });

    it('should return 400 when request body is invalid', async () => {
      const invalidBody = {
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      });
      const response = await POST(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it('should return 400 when request body is missing', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });
  });

  describe('PUT', () => {
    const mockUpdates = {
      playlistId: 'newPlaylist123',
      randomSeed: 'newSeed123',
    };

    it('should update an existing game', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);
      const updatedGame = {
        ...mockGame,
        ...mockUpdates,
      };
      (prisma.game.update as jest.Mock).mockResolvedValue(updatedGame);

      const request = new NextRequest('http://localhost:3000', {
        method: 'PUT',
        body: JSON.stringify(mockUpdates),
      });
      const response = await PUT(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        ...updatedGame,
        date: updatedGame.date.toISOString(),
      });
    });

    it('should return 404 when game not found', async () => {
      (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000', {
        method: 'PUT',
        body: JSON.stringify(mockUpdates),
      });
      const response = await PUT(request, { params: Promise.resolve({ date: mockDate }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Game not found for this date' });
    });
  });
}); 