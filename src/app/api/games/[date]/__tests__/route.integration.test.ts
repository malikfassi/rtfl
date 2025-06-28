import { NextRequest } from 'next/server';
import { describe, expect, beforeEach, afterEach, it } from '@jest/globals';
import { setupIntegrationTest, IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { GET } from '../route';

const date = '2024-01-01';
const userId = 'clrqm6nkw0011uy08kg9h1p4y';
const headers = new Headers({ 'x-user-id': userId });

let context: IntegrationTestContext;
let songId: string;

beforeEach(async () => {
  context = await setupIntegrationTest();
  const key = TRACK_KEYS.PARTY_IN_THE_USA;
  const track = fixtures.spotify.tracks[key];
  // Always create the song in the test DB and use its ID
  const song = await context.songService.create(track.id);
  songId = song.id;
  await context.gameService.createOrUpdate(date, songId);
});

afterEach(async () => {
  await context.cleanup();
});

describe('GET /api/games/[date]', () => {
  it('should return game state for existing game', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${date}`),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: Promise.resolve({ date }) });
    const data = await response.json();
    expect(response.status).toBe(200);
    integration_validator.game_state_service.getGameState(data);
  });

  it('should return 404 for non-existent game', async () => {
    // Use a valid date format for a date that does not exist in the test DB
    const nonexistentDate = '2024-12-31';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/games/${nonexistentDate}`),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: Promise.resolve({ date: nonexistentDate }) });
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid date format', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/invalid-date'),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: Promise.resolve({ date: 'invalid-date' }) });
    expect(response.status).toBe(400);
  });

  it('should return 400 for empty date', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/games/'),
      { method: 'GET', headers }
    );
    const response = await GET(request, { params: Promise.resolve({ date: '' }) });
    expect(response.status).toBe(400);
  });
}); 