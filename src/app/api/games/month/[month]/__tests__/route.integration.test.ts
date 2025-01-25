import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TEST_IDS, TEST_SCENARIOS } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';
import { prisma } from '@/app/api/lib/db';
import type { GameState } from '@/app/api/lib/types/game';

import { GET } from '../route';

const date = TEST_SCENARIOS.BASIC.dates[0]; // 2025-01-25
const month = '2025-01';
const userId = TEST_IDS.PLAYER_2;
const headers = new Headers({ 'x-user-id': userId });

describe('GET /api/games/month/[month]', () => {
  const testCase = TEST_SCENARIOS.BASIC.songs[0];

  beforeEach(async () => {
    await setupIntegrationTest();
    // Seed the BASIC scenario
    await TEST_SCENARIOS.BASIC.seedDB(prisma);

    // Get the game ID
    const game = await prisma.game.findFirst({
      where: { date }
    });
    if (!game) throw new Error('Failed to find seeded game');
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  test('returns game states for month', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/month/${month}`),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({ month }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3); // Three games in January (25th, 26th, 27th)
    
    // Validate first game state
    const gameState = data[0];
    validators.unit.gameState(gameState as GameState, testCase, userId);
  }, 10000);

  test('returns empty array when no games in month', async () => {
    const emptyMonth = '2024-02';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/month/${emptyMonth}`),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({ month: emptyMonth }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  }, 10000);

  test('returns 400 when month is invalid', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/month/invalid-month'),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({ month: 'invalid-month' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Invalid month format. Expected YYYY-MM');
  }, 10000);

  test('returns 400 when month is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/month'),
      { method: 'GET', headers }
    );

    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Month is required');
  }, 10000);
}); 