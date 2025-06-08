import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { setupIntegrationTest, IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { makeGET, makePOST, makeDELETE } from '../[date]/route';

const date = new Date().toISOString().split('T')[0];
const validTrackKey = TRACK_KEYS.PARTY_IN_THE_USA;
const validTrackId = fixtures.spotify.tracks[validTrackKey].id;

let context: IntegrationTestContext;

beforeEach(async () => {
  context = await setupIntegrationTest();
});

afterEach(async () => {
  await context.cleanup();
});

function getErrorMessage(msg: string | ((...args: any[]) => string), ...args: any[]): string {
  return typeof msg === 'function' ? msg(...args) : msg;
}

describe('GET /api/admin/games/[date]', () => {
  beforeEach(async () => {
    const song = await context.songService.create(validTrackId);
    await context.gameService.createOrUpdate(date, song.id);
  });

  test('returns game when found by date', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/${date}`),
      { method: 'GET' }
    );
    const GET = makeGET(context.prisma);
    const response = await GET(request, { params: { date } });
    const data = await response.json();
    expect(response.status).toBe(200);
    integration_validator.game_service.createOrUpdate(data);
  });

  test('returns 404 when game not found by date', async () => {
    const nonexistentDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]; // 1 year in the future
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/${nonexistentDate}`),
      { method: 'GET' }
    );
    const GET = makeGET(context.prisma);
    const response = await GET(request, { params: { date: nonexistentDate } });
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe(ErrorCode.GameNotFound);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.GameNotFound], nonexistentDate));
  });
});

describe('POST /api/admin/games/[date]', () => {
  test('creates game with valid data', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/${date}`),
      {
        method: 'POST',
        body: JSON.stringify({ spotifyId: validTrackId })
      }
    );
    const POST = makePOST(context.prisma);
    const response = await POST(request, { params: { date } });
    const data = await response.json();
    expect(response.status).toBe(200);
    integration_validator.game_service.createOrUpdate(data);
    // Verify game was created in database
    const game = await context.prisma.game.findUnique({ where: { date }, include: { song: true } });
    expect(game).toBeTruthy();
    integration_validator.game_service.createOrUpdate(game!);
  });

  test('returns 400 when date is invalid', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/invalid-date`),
      {
        method: 'POST',
        body: JSON.stringify({ spotifyId: validTrackId })
      }
    );
    const POST = makePOST(context.prisma);
    const response = await POST(request, { params: { date: 'invalid-date' } });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError], 'invalid-date'));
  });

  test('returns 400 when song ID is missing', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/${date}`),
      {
        method: 'POST',
        body: JSON.stringify({})
      }
    );
    const POST = makePOST(context.prisma);
    const response = await POST(request, { params: { date } });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
  });
});

describe('DELETE /api/admin/games', () => {
  beforeEach(async () => {
    const song = await context.songService.create(validTrackId);
    await context.gameService.createOrUpdate(date, song.id);
  });

  test('deletes game when found', async () => {
    // Debug: check if the game exists before DELETE
    const gameBefore = await context.prisma.game.findUnique({ where: { date } });
    // eslint-disable-next-line no-console
    console.log('DEBUG: Game before delete:', gameBefore);
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/${date}`),
      { method: 'DELETE' }
    );
    const DELETE = makeDELETE(context.prisma);
    const response = await DELETE(request, { params: { date } });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verify game was deleted from database
    const game = await context.prisma.game.findUnique({ where: { date } });
    expect(game).toBeNull();
  });

  test('returns 404 when game not found', async () => {
    const nonexistentDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]; // 1 year in the future
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games/${nonexistentDate}`),
      { method: 'DELETE' }
    );
    const DELETE = makeDELETE(context.prisma);
    const response = await DELETE(request, { params: { date: nonexistentDate } });
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe(ErrorCode.GameNotFound);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.GameNotFound], nonexistentDate));
  });

  test('returns 400 when date is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/games'),
      { method: 'DELETE' }
    );
    const DELETE = makeDELETE(context.prisma);
    const response = await DELETE(request, { params: { date: '' } });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
  });
}); 