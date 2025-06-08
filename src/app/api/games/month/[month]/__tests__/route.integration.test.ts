import { NextRequest } from 'next/server';
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

import { setupIntegrationTest, cleanupIntegrationTest, type IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import type { GameState } from '@/app/api/lib/types/game-state';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { makeGET } from '../route';
import { createGameService } from '@/app/api/lib/services/game';
import { createGuessService } from '@/app/api/lib/services/guess';

const month = '2025-01';
const userId = 'clrqm6nkw0011uy08kg9h1p4y'; // Use a valid CUID from your fixtures/constants
const headers = new Headers({ 'x-user-id': userId });

let context: IntegrationTestContext;
let gameService: ReturnType<typeof createGameService>;
let guessService: ReturnType<typeof createGuessService>;
let GET: ReturnType<typeof makeGET>;

beforeEach(async () => {
  context = await setupIntegrationTest();
  gameService = createGameService(context.songService, context.prisma);
  guessService = createGuessService(context.prisma);
  GET = makeGET(context.prisma);
  
  const keys = [TRACK_KEYS.PARTY_IN_THE_USA, TRACK_KEYS.BEAT_IT, TRACK_KEYS.LA_VIE_EN_ROSE];
  const dates = ['2025-01-25', '2025-01-26', '2025-01-27'];
  for (let i = 0; i < keys.length; i++) {
    const track = fixtures.spotify.tracks[keys[i]];
    const song = await context.songService.create(track.id);
    await gameService.createOrUpdate(dates[i], song.id);
  }
});

afterEach(async () => {
  await cleanupIntegrationTest();
});

describe('GET /api/games/month/[month]', () => {
  test('returns game states for month', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/month/${month}`),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: { month } });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
    // Validate each game state
    data.forEach((gameState: GameState) => {
      integration_validator.game_state_service.getGameState(gameState);
    });
  });

  test('returns empty array when no games in month', async () => {
    const emptyMonth = '2024-02';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/month/${emptyMonth}`),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: { month: emptyMonth } });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  test('returns 400 when month is invalid', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/month/invalid-month'),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: { month: 'invalid-month' } });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });

  test('returns 400 when month is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/month'),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: { month: '' } });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });
}); 