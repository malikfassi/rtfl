import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';
import type { GameService } from '@/lib/services/game';
import type { SongService } from '@/lib/services/song';

jest.mock('@/lib/services/game');
jest.mock('@/lib/services/song');

const mockDate = '2025-01-16T16:37:02.951Z';
const mockGame = {
  id: '1',
  date: '2024-01-01',
  songId: '1',
  createdAt: mockDate,
  updatedAt: mockDate,
  song: {
    id: '1',
    spotifyId: 'spotify:track:1',
    title: 'Test Song',
    artist: 'Test Artist',
    previewUrl: 'https://test.com/preview.mp3',
    lyrics: 'Test lyrics',
    maskedLyrics: {
      title: 'T*** S***',
      artist: 'T*** A*****',
      lyrics: 'T*** l*****'
    },
    createdAt: mockDate,
    updatedAt: mockDate
  }
};

const mockGames = [mockGame];

describe('GET /api/admin/games', () => {
  let mockGameService: jest.Mocked<GameService>;
  let mockSongService: jest.Mocked<SongService>;

  beforeEach(() => {
    mockSongService = {
      getOrCreate: jest.fn()
    } as unknown as jest.Mocked<SongService>;

    mockGameService = {
      getByMonth: jest.fn().mockResolvedValue(mockGames),
      getByDate: jest.fn().mockResolvedValue(mockGame),
      createOrUpdate: jest.fn().mockResolvedValue(mockGame),
      delete: jest.fn().mockResolvedValue(mockGame)
    } as unknown as jest.Mocked<GameService>;

    const { createGameService } = jest.requireMock('@/lib/services/game');
    const { createSongService } = jest.requireMock('@/lib/services/song');

    createGameService.mockReturnValue(mockGameService);
    createSongService.mockReturnValue(mockSongService);
  });

  it('returns games for a given month', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?month=2024-01'));
    const response = await GET(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockGames);
  });

  it('returns a game for a given date', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?date=2024-01-01'));
    const response = await GET(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockGame);
  });

  it('returns 404 when game is not found', async () => {
    mockGameService.getByDate.mockRejectedValueOnce(new Error('NOT_FOUND: Game not found for date: 2024-01-01'));
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?date=2024-01-01'));
    const response = await GET(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'NOT_FOUND', message: 'NOT_FOUND: Game not found for date: 2024-01-01' });
  });

  it('returns 400 when neither date nor month is provided', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games'));
    const response = await GET(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'MISSING_PARAMS', message: 'date or month parameter is required' });
  });

  it('returns 400 for invalid month format', async () => {
    mockGameService.getByMonth.mockRejectedValueOnce(new Error('INVALID_FORMAT: Invalid month format'));
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?month=invalid'));
    const response = await GET(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'INVALID_FORMAT', message: 'INVALID_FORMAT: Invalid month format' });
  });
});

describe('POST /api/admin/games', () => {
  let mockGameService: jest.Mocked<GameService>;
  let mockSongService: jest.Mocked<SongService>;

  beforeEach(() => {
    mockSongService = {
      getOrCreate: jest.fn()
    } as unknown as jest.Mocked<SongService>;

    mockGameService = {
      getByMonth: jest.fn().mockResolvedValue(mockGames),
      getByDate: jest.fn().mockResolvedValue(mockGame),
      createOrUpdate: jest.fn().mockResolvedValue(mockGame),
      delete: jest.fn().mockResolvedValue(mockGame)
    } as unknown as jest.Mocked<GameService>;

    jest.mock('@/lib/services/game', () => ({
      createGameService: () => mockGameService
    }));

    jest.mock('@/lib/services/song', () => ({
      createSongService: () => mockSongService
    }));
  });

  it('creates a new game with valid data', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games'), {
      method: 'POST',
      body: JSON.stringify({ date: '2024-01-01', spotifyId: 'spotify:track:1' })
    });
    const response = await POST(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockGame);
  });

  it('returns 400 for invalid data', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games'), {
      method: 'POST',
      body: JSON.stringify({})
    });
    const response = await POST(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'MISSING_PARAMS', message: 'date and spotifyId are required' });
  });
});

describe('DELETE /api/admin/games', () => {
  let mockGameService: jest.Mocked<GameService>;
  let mockSongService: jest.Mocked<SongService>;

  beforeEach(() => {
    mockSongService = {
      getOrCreate: jest.fn()
    } as unknown as jest.Mocked<SongService>;

    mockGameService = {
      getByMonth: jest.fn().mockResolvedValue(mockGames),
      getByDate: jest.fn().mockResolvedValue(mockGame),
      createOrUpdate: jest.fn().mockResolvedValue(mockGame),
      delete: jest.fn()
    } as unknown as jest.Mocked<GameService>;

    const { createGameService } = jest.requireMock('@/lib/services/game');
    const { createSongService } = jest.requireMock('@/lib/services/song');

    createGameService.mockReturnValue(mockGameService);
    createSongService.mockReturnValue(mockSongService);
  });

  it('deletes a game for a given date', async () => {
    mockGameService.delete.mockResolvedValueOnce();
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?date=2024-01-01'), {
      method: 'DELETE'
    });
    const response = await DELETE(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(204);
  });

  it('returns 400 for invalid date format', async () => {
    mockGameService.delete.mockRejectedValueOnce(new Error('INVALID_FORMAT: Invalid date format'));
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?date=invalid'), {
      method: 'DELETE'
    });
    const response = await DELETE(req);
    expect(response).toBeDefined();
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'INVALID_FORMAT', message: 'INVALID_FORMAT: Invalid date format' });
  });
}); 