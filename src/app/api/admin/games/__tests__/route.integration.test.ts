import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest, 
  spotifyData
} from '@/lib/test';
import { prisma } from '@/lib/db';

describe('Games API Integration', () => {
  const [trackId] = Object.entries(spotifyData.tracks)[0];
  const date = '2024-01-01';
  const date2 = '2024-01-02';

  beforeEach(async () => {
    await setupIntegrationTest();
    // Clean up any existing games
    await prisma.game.deleteMany();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('GET /api/admin/games', () => {
    beforeEach(async () => {
      const context = await setupIntegrationTest();
      // Create test games
      await context.gameService.createOrUpdate(date, trackId);
      await context.gameService.createOrUpdate(date2, trackId);
    });

    test('returns games for month', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?month=2024-01'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].date).toBe(date);
      expect(data[1].date).toBe(date2);
    });

    test('returns game for date', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games?date=${date}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe(date);
    });

    test('returns 404 when game not found', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-03'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found for date: 2024-01-03');
    });

    test('returns 400 when no date or month provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid month format. Expected YYYY-MM');
    });
  });

  describe('POST /api/admin/games', () => {
    test('creates new game', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games',
        {
          method: 'POST',
          body: JSON.stringify({
            date,
            spotifyId: trackId
          })
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe(date);
      expect(data.song.spotifyId).toBe(trackId);

      // Verify in database
      const game = await prisma.game.findUnique({
        where: { date },
        include: { song: true }
      });
      expect(game).toBeTruthy();
      expect(game!.song.spotifyId).toBe(trackId);
    });

    test('returns 400 for invalid date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games',
        {
          method: 'POST',
          body: JSON.stringify({
            date: 'invalid-date',
            spotifyId: trackId
          })
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format: invalid-date');
    });
  });

  describe('DELETE /api/admin/games', () => {
    beforeEach(async () => {
      const context = await setupIntegrationTest();
      // Create test game
      await context.gameService.createOrUpdate(date, trackId);
    });

    test('deletes game', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games?date=${date}`,
        {
          method: 'DELETE'
        }
      );

      const response = await DELETE(request);
      expect(response.status).toBe(204);

      // Verify deletion
      const game = await prisma.game.findUnique({
        where: { date }
      });
      expect(game).toBeNull();
    });

    test('returns 400 when date is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games',
        {
          method: 'DELETE'
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Expected YYYY-MM-DD');
    });

    test('returns 404 when game not found', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-03',
        {
          method: 'DELETE'
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found for date: 2024-01-03');
    });
  });
}); 