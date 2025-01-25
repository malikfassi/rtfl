import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TEST_SCENARIOS, TEST_IDS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import { createGameService } from '@/app/api/lib/services/game';
import type { GameState } from '@/app/api/lib/types/game';

import { GET } from '../route';

const date = '2024-01-01';
const userId = TEST_IDS.PLAYER;
const headers = new Headers({ 'x-user-id': userId });

describe('GET /api/games/[date]', () => {
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

  test('returns game state when found', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${date}`),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({ date }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    validators.integration.gameState(data as GameState, testCase, userId);
  }, 10000);

  test('returns 404 when game not found', async () => {
    const nonexistentDate = '2024-12-31';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${nonexistentDate}`),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({ date: nonexistentDate }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toBe(`Game not found for date: ${nonexistentDate}`);
  }, 10000);

  test('returns 400 when date is invalid', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/invalid-date'),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({ date: 'invalid-date' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Invalid date format. Expected YYYY-MM-DD');
  }, 10000);

  test('returns 400 when date is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games'),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Date is required');
  }, 10000);
}); 