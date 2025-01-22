import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest, 
  spotifyData 
} from '@/lib/test';
import { prisma } from '@/lib/db';

describe('Games by Date API Integration', () => {
  const [trackId] = Object.entries(spotifyData.tracks)[0];
  const date = '2024-01-01';

  beforeEach(async () => {
    await setupIntegrationTest();
    // Clean up any existing games
    await prisma.game.deleteMany();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('GET /api/admin/games/[date]', () => {
    beforeEach(async () => {
      const context = await setupIntegrationTest();
      // Create test game
      await context.gameService.createOrUpdate(date, trackId);
    });

    test('returns game when found', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`
      );

      const response = await GET(request, { params: { date } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe(date);
      expect(data.song.spotifyId).toBe(trackId);
    });

    test('returns 404 when game not found', async () => {
      const nonexistentDate = '2024-12-31';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${nonexistentDate}`
      );

      const response = await GET(request, { params: { date: nonexistentDate } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(`Game not found for date: ${nonexistentDate}`);
    });

    test('returns 400 for invalid date format', async () => {
      const invalidDate = 'invalid-date';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${invalidDate}`
      );

      const response = await GET(request, { params: { date: invalidDate } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(`Invalid date format: ${invalidDate}`);
    });
  });

  describe('POST /api/admin/games/[date]', () => {
    test('creates new game', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: trackId
          })
        }
      );

      const response = await POST(request, { params: { date } });
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

    test('updates existing game', async () => {
      // First create a game
      const context = await setupIntegrationTest();
      await context.gameService.createOrUpdate(date, trackId);

      // Then update it with new track
      const [newTrackId] = Object.entries(spotifyData.tracks)[1];

      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: newTrackId
          })
        }
      );

      const response = await POST(request, { params: { date } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe(date);
      expect(data.song.spotifyId).toBe(newTrackId);

      // Verify in database
      const game = await prisma.game.findUnique({
        where: { date },
        include: { song: true }
      });
      expect(game).toBeTruthy();
      expect(game!.song.spotifyId).toBe(newTrackId);
    });

    test('returns 400 when required fields are missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
          })
        }
      );

      const response = await POST(request, { params: { date } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns 400 for invalid date format', async () => {
      const invalidDate = 'invalid-date';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${invalidDate}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: trackId
          })
        }
      );

      const response = await POST(request, { params: { date: invalidDate } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(`Invalid date format: ${invalidDate}`);
    });
  });
}); 