import { NextRequest } from 'next/server';
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

describe('GET /api/admin/games/[date]', () => {
  const mockDate = '2024-01-01';
  const mockGame = {
    id: 1,
    date: new Date(mockDate),
    playlistId: 'test-playlist',
    randomSeed: '42',
    overrideSongId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return game data for a valid date', async () => {
    (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
    const request = createMockRequest(`/api/admin/games/${mockDate}`) as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ date: mockDate }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockGame);
  });

  it('should return 404 if game does not exist', async () => {
    (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);
    const request = createMockRequest(`/api/admin/games/${mockDate}`) as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ date: mockDate }) });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Game not found');
  });

  it('should return 400 for invalid date format', async () => {
    const request = createMockRequest('/api/admin/games/invalid-date') as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ date: 'invalid-date' }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
  });
});

describe('POST /api/admin/games/[date]', () => {
  const mockDate = '2024-01-01';
  const mockGame = {
    id: 1,
    date: new Date(mockDate),
    playlistId: 'test-playlist',
    randomSeed: '42',
    overrideSongId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new game', async () => {
    (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);
    const request = createMockRequest(`/api/admin/games/${mockDate}`, {
      method: 'POST',
      body: { playlistId: 'test-playlist' },
    }) as unknown as NextRequest;
    const response = await POST(request, { params: Promise.resolve({ date: mockDate }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockGame);
  });

  it('should return 400 for invalid date format', async () => {
    const request = createMockRequest('/api/admin/games/invalid-date', {
      method: 'POST',
      body: { playlistId: 'test-playlist' },
    }) as unknown as NextRequest;
    const response = await POST(request, { params: Promise.resolve({ date: 'invalid-date' }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
  });

  it('should return 400 if game already exists', async () => {
    (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
    const request = createMockRequest(`/api/admin/games/${mockDate}`, {
      method: 'POST',
      body: { playlistId: 'test-playlist' },
    }) as unknown as NextRequest;
    const response = await POST(request, { params: Promise.resolve({ date: mockDate }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Game already exists for this date');
  });
});

describe('PUT /api/admin/games/[date]', () => {
  const mockDate = '2024-01-01';
  const mockGame = {
    id: 1,
    date: new Date(mockDate),
    playlistId: 'test-playlist',
    randomSeed: '42',
    overrideSongId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an existing game', async () => {
    (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
    (prisma.game.update as jest.Mock).mockResolvedValue({ ...mockGame, randomSeed: '43' });
    const request = createMockRequest(`/api/admin/games/${mockDate}`, {
      method: 'PUT',
      body: { playlistId: 'test-playlist' },
    }) as unknown as NextRequest;
    const response = await PUT(request, { params: Promise.resolve({ date: mockDate }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ...mockGame, randomSeed: '43' });
  });

  it('should return 404 if game does not exist', async () => {
    (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);
    const request = createMockRequest(`/api/admin/games/${mockDate}`, {
      method: 'PUT',
      body: { playlistId: 'test-playlist' },
    }) as unknown as NextRequest;
    const response = await PUT(request, { params: Promise.resolve({ date: mockDate }) });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Game not found');
  });

  it('should return 400 for invalid date format', async () => {
    const request = createMockRequest('/api/admin/games/invalid-date', {
      method: 'PUT',
      body: { playlistId: 'test-playlist' },
    }) as unknown as NextRequest;
    const response = await PUT(request, { params: Promise.resolve({ date: 'invalid-date' }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
  });
}); 