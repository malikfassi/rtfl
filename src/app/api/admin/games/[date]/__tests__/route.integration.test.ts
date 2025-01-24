import { NextRequest } from 'next/server';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import { prisma } from '@/app/api/lib/test/test-env/db';

import { GET, POST } from '../route';

describe('Games by Date API Integration', () => {
  const validSongCase = TEST_CASES.SONGS.VALID;
  const frenchSongCase = TEST_CASES.SONGS.FRENCH;
  const date = '2024-01-01';
  let context: Awaited<ReturnType<typeof setupIntegrationTest>>;

  beforeEach(async () => {
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('GET /api/admin/games/[date]', () => {
    beforeEach(async () => {
      // Create test game
      await context.gameService.createOrUpdate(date, validSongCase.id);
    });

    test('returns game when found', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`
      );

      const response = await GET(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      validators.integration.game(data, validSongCase, date);
    });

    test('returns 404 when game not found', async () => {
      const nonexistentDate = '2024-12-31';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${nonexistentDate}`
      );

      const response = await GET(request, { params: Promise.resolve({ date: nonexistentDate }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
      expect(data.message).toBe(`Game not found for date: ${nonexistentDate}`);
    });

    test('returns 400 for invalid date format', async () => {
      const invalidDate = 'invalid-date';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${invalidDate}`
      );

      const response = await GET(request, { params: Promise.resolve({ date: invalidDate }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Invalid date format. Expected YYYY-MM-DD');
    });
  });

  describe('POST /api/admin/games/[date]', () => {
    test('creates new game', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: validSongCase.id
          })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
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

    test('updates existing game', async () => {
      // First create a game
      await context.gameService.createOrUpdate(date, validSongCase.id);

      // Then update it with new track
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: frenchSongCase.id
          })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      validators.integration.game(data, frenchSongCase, date);

      // Verify in database
      const game = await prisma.game.findUnique({
        where: { date },
        include: { song: true }
      });
      expect(game).toBeTruthy();
      if (game) {
        validators.unit.game(game, frenchSongCase, date);
      }
    });

    test('returns 400 when required fields are missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: ''
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
      expect(data.message).toBe('Internal server error');
    });

    test('returns 400 for invalid date format', async () => {
      const invalidDate = 'invalid-date';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${invalidDate}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: validSongCase.id
          })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date: invalidDate }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Invalid date format. Expected YYYY-MM-DD');
    });

    test('returns 400 when Spotify ID is missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({ otherField: 'value' })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Required');
    });
  });
}); 