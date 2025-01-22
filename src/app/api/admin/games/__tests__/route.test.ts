import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { setupUnitTest, type UnitTestContext, spotifyData } from '@/lib/test';
import type { Game, Song } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';

describe('GET /api/admin/games', () => {
  let context: UnitTestContext;
  const trackId = Object.keys(spotifyData.tracks)[0];

  beforeEach(() => {
    context = setupUnitTest();
  });

  describe('by month', () => {
    test('returns games for month', async () => {
      const { mockGameService } = context;
      const games = [
        {
          id: '1',
          date: '2024-01-01',
          songId: trackId,
          song: {
            id: 'song1',
            spotifyId: 'spotify1',
            spotifyData: {} as JsonValue,
            geniusData: {} as JsonValue,
            lyrics: 'test lyrics',
            maskedLyrics: {} as JsonValue,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          date: '2024-01-02',
          songId: trackId,
          song: {
            id: 'song2',
            spotifyId: 'spotify2',
            spotifyData: {} as JsonValue,
            geniusData: {} as JsonValue,
            lyrics: 'test lyrics 2',
            maskedLyrics: {} as JsonValue,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      jest.spyOn(mockGameService, 'getByMonth').mockResolvedValue(games);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?month=2024-01'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(games);
      expect(mockGameService.getByMonth).toHaveBeenCalledWith('2024-01');
    });

    test('returns 400 when month is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'INVALID_REQUEST',
        message: 'Missing month parameter'
      });
    });

    test('returns 400 when month is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?month=invalid'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'INVALID_REQUEST',
        message: 'Invalid month format'
      });
    });

    test('returns 500 when get games fails', async () => {
      const { mockGameService } = context;
      jest.spyOn(mockGameService, 'getByMonth').mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?month=2024-01'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to get games: Error: Database error'
      });
    });
  });

  describe('by date', () => {
    test('returns game for date', async () => {
      const { mockGameService } = context;
      const game = {
        id: '1',
        date: '2024-01-01',
        songId: trackId,
        song: {
          id: 'song1',
          spotifyId: 'spotify1',
          spotifyData: {} as JsonValue,
          geniusData: {} as JsonValue,
          lyrics: 'test lyrics',
          maskedLyrics: {} as JsonValue,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(mockGameService, 'getByDate').mockResolvedValue(game);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-01'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(game);
      expect(mockGameService.getByDate).toHaveBeenCalledWith('2024-01-01');
    });

    test('returns 400 when date is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=invalid'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'INVALID_REQUEST',
        message: 'Invalid date format'
      });
    });

    test('returns 404 when game is not found', async () => {
      const { mockGameService } = context;
      jest.spyOn(mockGameService, 'getByDate').mockResolvedValue(undefined as unknown as Game & { song: Song });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-01'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ 
        error: 'NOT_FOUND',
        message: 'Game not found'
      });
    });

    test('returns 500 when get game fails', async () => {
      const { mockGameService } = context;
      jest.spyOn(mockGameService, 'getByDate').mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-01'
      );

      const response = await GET(request, {});
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to get game: Error: Database error'
      });
    });
  });

  test('returns 400 when neither date nor month is provided', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games'));
    const response = await GET(req, {});
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ 
      error: 'MISSING_PARAMS',
      message: 'date or month parameter is required'
    });
  });

  test('returns 400 for malformed URL', async () => {
    const req = new NextRequest('not-a-valid-url');
    const response = await GET(req, {});
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch game'
    });
  });
});

describe('POST /api/admin/games', () => {
  let context: UnitTestContext;
  const trackId = Object.keys(spotifyData.tracks)[0];

  beforeEach(() => {
    context = setupUnitTest();
  });

  test('creates game', async () => {
    const { mockGameService } = context;
    const game = {
      id: '1',
      date: '2024-01-01',
      songId: trackId,
      song: {
        id: 'song1',
        spotifyId: 'spotify1',
        spotifyData: {} as JsonValue,
        geniusData: {} as JsonValue,
        lyrics: 'test lyrics',
        maskedLyrics: {} as JsonValue,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    jest.spyOn(mockGameService, 'createOrUpdate').mockResolvedValue(game);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/games',
      {
        method: 'POST',
        body: JSON.stringify({
          spotifyId: trackId,
          date: '2024-01-01'
        })
      }
    );

    const response = await POST(request, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(game);
    expect(mockGameService.createOrUpdate).toHaveBeenCalledWith('2024-01-01', trackId);
  });

  test('returns 400 when date is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/games',
      {
        method: 'POST',
        body: JSON.stringify({
          spotifyId: trackId
        })
      }
    );

    const response = await POST(request, {});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      error: 'INVALID_REQUEST',
      message: 'Missing date parameter'
    });
  });

  test('returns 400 when spotifyId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/games',
      {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-01'
        })
      }
    );

    const response = await POST(request, {});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      error: 'INVALID_REQUEST',
      message: 'Missing spotifyId parameter'
    });
  });

  test('returns 400 when body is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/games',
      {
        method: 'POST'
      }
    );

    const response = await POST(request, {});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      error: 'INVALID_REQUEST',
      message: 'Missing request body'
    });
  });

  test('returns 500 when create game fails', async () => {
    const { mockGameService } = context;
    jest.spyOn(mockGameService, 'createOrUpdate').mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/games',
      {
        method: 'POST',
        body: JSON.stringify({
          spotifyId: trackId,
          date: '2024-01-01'
        })
      }
    );

    const response = await POST(request, {});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to create game: Error: Database error'
    });
  });
});

describe('DELETE /api/admin/games', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  test('deletes game', async () => {
    const { mockGameService } = context;
    jest.spyOn(mockGameService, 'delete').mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/games?date=2024-01-01',
      {
        method: 'DELETE'
      }
    );

    const response = await DELETE(request, {});
    expect(response.status).toBe(204);
    expect(mockGameService.delete).toHaveBeenCalledWith('2024-01-01');
  });

  test('returns 400 when date is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/games',
      {
        method: 'DELETE'
      }
    );

    const response = await DELETE(request, {});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      error: 'INVALID_REQUEST',
      message: 'Missing date parameter'
    });
  });

  test('returns 500 when delete game fails', async () => {
    const { mockGameService } = context;
    jest.spyOn(mockGameService, 'delete').mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/games?date=2024-01-01',
      {
        method: 'DELETE'
      }
    );

    const response = await DELETE(request, {});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete game: Error: Database error'
    });
  });
}); 