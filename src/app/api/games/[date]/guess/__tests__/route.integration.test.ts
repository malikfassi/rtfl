import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TEST_SCENARIOS, TEST_IDS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import { createGameService } from '@/app/api/lib/services/game';
import { prisma } from '@/app/api/lib/test/test-env/db';
import type { GameState } from '@/app/api/lib/types/game';

import { POST } from '../route';

const date = '2024-01-01';
const userId = TEST_IDS.PLAYER_2;
const headers = new Headers({ 'x-user-id': userId });

describe('POST /api/games/[date]/guess', () => {
  const testCase = TEST_SCENARIOS.BASIC.songs[0];

  beforeEach(async () => {
    await setupIntegrationTest();
    // Create test game
    const gameService = await createGameService();
    await gameService.createOrUpdate(date, testCase.id);
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  test('submits valid guess and returns updated game state', async () => {
    const guess = testCase.helpers.getTitleWords()[0]; // First word of title
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${date}/guess`),
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ guess })
      }
    );

    const response = await POST(request, { params: Promise.resolve({ date }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    validators.unit.gameState(data as GameState, testCase, userId);

    // Verify guess was saved in database
    const savedGuess = await prisma.guess.findFirst({
      where: {
        playerId: userId,
        word: guess.toLowerCase()
      }
    });
    expect(savedGuess).toBeTruthy();
  }, 10000);

  test('returns 400 when guess is missing', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${date}/guess`),
      {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      }
    );

    const response = await POST(request, { params: Promise.resolve({ date }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Guess is required');
  }, 10000);

  test('returns 404 when game not found', async () => {
    const nonexistentDate = '2024-12-31';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${nonexistentDate}/guess`),
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ guess: 'test' })
      }
    );

    const response = await POST(request, { params: Promise.resolve({ date: nonexistentDate }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toBe(`Game not found for date: ${nonexistentDate}`);
  }, 10000);

  test('returns 400 when date is invalid', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/invalid-date/guess'),
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ guess: 'test' })
      }
    );

    const response = await POST(request, { params: Promise.resolve({ date: 'invalid-date' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Invalid date format. Expected YYYY-MM-DD');
  }, 10000);
}); 