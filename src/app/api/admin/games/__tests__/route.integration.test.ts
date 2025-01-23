import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest
} from '@/lib/test';
import { prisma } from '@/lib/db';
import { TEST_CASES } from '@/lib/test/fixtures/core/test_cases';
import { validators } from '@/lib/test/fixtures/core/validators';
import type { Game, Song } from '@prisma/client';

type GameWithSong = Game & { song: Song };

describe('Games API Integration', () => {
  const validSongCase = TEST_CASES.SONGS.VALID;
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
      await context.gameService.createOrUpdate(date, validSongCase.id);
      await context.gameService.createOrUpdate(date2, validSongCase.id);
    });

    test('returns games for month', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?month=2024-01'
      );

      const response = await GET(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].date).toBe(date);
      expect(data[1].date).toBe(date2);

      // Test both games have the expected song data
      data.forEach((game: GameWithSong) => {
        validators.integration.game(game, validSongCase, game.date);
      });
    });

    test('returns game for date', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games?date=${date}`
      );

      const response = await GET(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(200);
      validators.integration.game(data, validSongCase, date);
    });

    test('returns 404 when game not found', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-03'
      );

      const response = await GET(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found for date: 2024-01-03');
    });

    test('returns 400 when no date or month provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games'
      );

      const response = await GET(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Expected string, received null');
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
            spotifyId: validSongCase.id
          })
        }
      );

      const response = await POST(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(200);
      validators.integration.game(data, validSongCase, date);

      // Verify in database
      const game = await prisma.game.findUnique({
        where: { date },
        include: { song: true }
      });
      expect(game).toBeTruthy();
      if (game) {
        validators.unit.game(game, validSongCase, date);
      }
    });

    test('returns 400 for invalid date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games',
        {
          method: 'POST',
          body: JSON.stringify({
            date: 'invalid-date',
            spotifyId: validSongCase.id
          })
        }
      );

      const response = await POST(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Expected YYYY-MM-DD');
    });
  });

  describe('DELETE /api/admin/games', () => {
    beforeEach(async () => {
      const context = await setupIntegrationTest();
      // Create test game
      await context.gameService.createOrUpdate(date, validSongCase.id);
    });

    test('deletes game for date', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games?date=${date}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe(date);

      // Verify game was deleted
      const game = await prisma.game.findFirst({
        where: { date }
      });
      expect(game).toBeNull();
    });

    test('returns 400 when date is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games',
        { method: 'DELETE' }
      );

      const response = await DELETE(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Expected string, received null');
    });

    test('returns 404 when game not found', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/games?date=2024-01-03',
        { method: 'DELETE' }
      );

      const response = await DELETE(request, undefined);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found for date: 2024-01-03');
    });
  });
}); 