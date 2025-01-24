import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import { prisma } from '@/app/api/lib/test/test-env/db';
import { createGameService } from '@/app/api/lib/services/game';

import { DELETE, GET, POST } from '../route';

const date = '2024-01-01';

describe('Games API Integration', () => {
  const validSongCase = TEST_CASES.SONGS.VALID;

  beforeEach(async () => {
    await setupIntegrationTest();
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  describe('GET /api/admin/games/[date]', () => {
    beforeEach(async () => {
      // Create test game
      const gameService = await createGameService();
      await gameService.createOrUpdate(date, validSongCase.id);
    }, 10000);

    test('returns game when found by date', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${date}`),
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      validators.integration.game(data, validSongCase, date);
    }, 10000);

    test('returns 404 when game not found by date', async () => {
      const nonexistentDate = '2024-12-31';
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${nonexistentDate}`),
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ date: nonexistentDate }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
      expect(data.message).toBe(`Game not found for date: ${nonexistentDate}`);
    }, 10000);

    test('updates existing game', async () => {
      // First create a game
      const gameService = await createGameService();
      await gameService.createOrUpdate(date, validSongCase.id);

      // ... rest of the test ...
    });
  });

  describe('POST /api/admin/games/[date]', () => {
    test('creates game with valid data', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${date}`),
        {
          method: 'POST',
          body: JSON.stringify({ spotifyId: validSongCase.id })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      validators.integration.game(data, validSongCase, date);

      // Verify game was created in database
      const game = await prisma.game.findUnique({
        where: { date },
        include: { song: true }
      });
      expect(game).toBeTruthy();
      validators.integration.game(game!, validSongCase, date);
    }, 10000);

    test('returns 400 when date is invalid', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/invalid-date`),
        {
          method: 'POST',
          body: JSON.stringify({ spotifyId: validSongCase.id })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date: 'invalid-date' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Invalid date format. Expected YYYY-MM-DD');
    }, 10000);

    test('returns 400 when song ID is missing', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${date}`),
        {
          method: 'POST',
          body: JSON.stringify({})
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Required');
    }, 10000);
  });

  describe('DELETE /api/admin/games', () => {
    beforeEach(async () => {
      // Create test game
      const gameService = await createGameService();
      await gameService.createOrUpdate(date, validSongCase.id);
    }, 10000);

    test('deletes game when found', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${date}`),
        {
          method: 'DELETE'
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify game was deleted from database
      const game = await prisma.game.findUnique({
        where: { date }
      });
      expect(game).toBeNull();
    }, 10000);

    test('returns 404 when game not found', async () => {
      const nonexistentDate = '2024-12-31';
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/games/${nonexistentDate}`),
        {
          method: 'DELETE'
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ date: nonexistentDate }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
      expect(data.message).toBe(`Game not found for date: ${nonexistentDate}`);
    }, 10000);

    test('returns 400 when date is missing', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/games'),
        {
          method: 'DELETE'
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ date: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Invalid date format. Expected YYYY-MM-DD');
    }, 10000);
  });
}); 