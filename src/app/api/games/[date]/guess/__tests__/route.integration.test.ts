import { NextRequest } from 'next/server';
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

import { setupIntegrationTest, IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { Prisma } from '@prisma/client';

import { POST } from '../route';

const date = '2024-01-01';
const userId = 'clrqm6nkw0011uy08kg9h1p4y'; // Use a valid CUID from your fixtures/constants
const headers = new Headers({ 'x-user-id': userId });

let context: IntegrationTestContext;

beforeEach(async () => {
  context = await setupIntegrationTest();
  const key = TRACK_KEYS.PARTY_IN_THE_USA;
  const track = fixtures.spotify.tracks[key];
  const lyrics = fixtures.genius.lyrics[key];
  const maskedLyrics = fixtures.genius.maskedLyrics[key];
  const geniusSearch = fixtures.genius.search[key];
  
  // Create the song directly in the database using fixture data
  const song = await context.prisma.song.create({
    data: {
      spotifyId: track.id,
      spotifyData: track as unknown as Prisma.InputJsonValue,
      geniusData: geniusSearch.response.hits[0].result as unknown as Prisma.InputJsonValue,
      lyrics,
      maskedLyrics: maskedLyrics as unknown as Prisma.InputJsonValue
    }
  });
  
  await context.gameService.createOrUpdate(date, song.id);
});

afterEach(async () => {
  await context.cleanup();
});

describe('POST /api/games/[date]/guess', () => {
  test('submits valid guess and returns updated game state', async () => {
    const guess = 'party'; // Example guess word
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
    integration_validator.game_state_service.getGameState(data);
  });

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
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });

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
    expect(data.error).toBe(ErrorCode.GameNotFoundForGuess);
    expect(data.message).toBe((ErrorMessage[ErrorCode.GameNotFoundForGuess] as (date: string) => string)(nonexistentDate));
  });

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
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });
}); 