import { createMockRequest } from '@/lib/test/mocks';
import { GET, POST, PUT } from './route';
import { prisma } from '@/lib/prisma';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => {
      return {
        status: init?.status || 200,
        json: async () => data,
      };
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockDate = '2025-01-11';
const mockGame = {
  id: 1,
  date: new Date(mockDate),
  playlistId: 'playlist123',
  randomSeed: '42',
  overrideSongId: null,
};

describe('Admin Games API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return game data for a valid date', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      const request = createMockRequest('http://localhost:3000');
      const response = await GET(request, { params: { date: mockDate } });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockGame);
    });

    it('should return 404 if game does not exist', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);
      const request = createMockRequest('http://localhost:3000');
      const response = await GET(request, { params: { date: mockDate } });
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid date format', async () => {
      const request = createMockRequest('http://localhost:3000');
      const response = await GET(request, { params: { date: 'invalid-date' } });
      expect(response.status).toBe(400);
    });
  });

  describe('POST', () => {
    it('should create a new game', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);
      const request = createMockRequest('http://localhost:3000', {
        method: 'POST',
        body: { playlistId: 'playlist123', randomSeed: '42' },
      });
      const response = await POST(request, { params: { date: mockDate } });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockGame);
    });

    it('should return 400 for invalid date format', async () => {
      const request = createMockRequest('http://localhost:3000', {
        method: 'POST',
        body: { playlistId: 'playlist123', randomSeed: '42' },
      });
      const response = await POST(request, { params: { date: 'invalid-date' } });
      expect(response.status).toBe(400);
    });

    it('should return 400 if game already exists', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      const request = createMockRequest('http://localhost:3000', {
        method: 'POST',
        body: { playlistId: 'playlist123', randomSeed: '42' },
      });
      const response = await POST(request, { params: { date: mockDate } });
      expect(response.status).toBe(400);
    });
  });

  describe('PUT', () => {
    it('should update an existing game', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue({ ...mockGame, randomSeed: '43' });
      const request = createMockRequest('http://localhost:3000', {
        method: 'PUT',
        body: { playlistId: 'playlist123', randomSeed: '43', overrideSongId: null },
      });
      const response = await PUT(request, { params: { date: mockDate } });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ...mockGame, randomSeed: '43' });
    });

    it('should return 404 if game does not exist', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);
      const request = createMockRequest('http://localhost:3000', {
        method: 'PUT',
        body: { playlistId: 'playlist123', randomSeed: '43', overrideSongId: null },
      });
      const response = await PUT(request, { params: { date: mockDate } });
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid date format', async () => {
      const request = createMockRequest('http://localhost:3000', {
        method: 'PUT',
        body: { playlistId: 'playlist123', randomSeed: '43', overrideSongId: null },
      });
      const response = await PUT(request, { params: { date: 'invalid-date' } });
      expect(response.status).toBe(400);
    });
  });
}); 