import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { setupIntegrationTest, cleanupIntegrationTest, IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS, TRACK_URIS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { GET, POST, DELETE } from '../route';
import { Prisma } from '@prisma/client';

const date = new Date().toISOString().split('T')[0];
const validTrackKey = TRACK_KEYS.PARTY_IN_THE_USA;
const validTrackId = TRACK_URIS[validTrackKey].split(':').pop()!;

let context: IntegrationTestContext;

beforeEach(async () => {
  context = await setupIntegrationTest();
});

afterEach(async () => {
  await cleanupIntegrationTest();
});

describe('GET /api/admin/games', () => {
  beforeEach(async () => {
    // Debug log before song creation
    // eslint-disable-next-line no-console
    console.log('DEBUG: Starting song creation');
    const song = await context.prisma.song.create({
      data: {
        spotifyId: validTrackId,
        lyrics: fixtures.genius.lyrics[validTrackKey],
        maskedLyrics: fixtures.genius.maskedLyrics[validTrackKey] as unknown as Prisma.InputJsonValue,
        spotifyData: fixtures.spotify.tracks[validTrackKey] as unknown as Prisma.InputJsonValue,
        geniusData: fixtures.genius.search[validTrackKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
      }
    });
    // Debug log after song creation
    // eslint-disable-next-line no-console
    console.log('DEBUG: Song created', song.id);

    // Debug log before game creation
    // eslint-disable-next-line no-console
    console.log('DEBUG: Starting game creation');
    await context.prisma.game.create({
      data: {
        date,
        songId: song.id
      }
    });
    // Debug log after game creation
    // eslint-disable-next-line no-console
    console.log('DEBUG: Game created for date', date);
  });

  test('returns game when found by date', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games?date=${date}`),
      { method: 'GET' }
    );
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    // Debug logs
    // eslint-disable-next-line no-console
    console.log('DEBUG: game.song.spotifyId:', data.song?.spotifyId);
    // eslint-disable-next-line no-console
    console.log('DEBUG: expected validTrackId:', validTrackId);
    // eslint-disable-next-line no-console
    console.log('DEBUG: TRACK_URIS IDs:', Object.values(TRACK_URIS).map(uri => uri.split(':').pop()));
    integration_validator.game_service.createOrUpdate(data);
    // Validate game stats
    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('totalGuesses');
    expect(data.stats).toHaveProperty('correctGuesses');
    expect(data.stats).toHaveProperty('averageAttempts');
    expect(typeof data.stats.totalGuesses).toBe('number');
    expect(typeof data.stats.correctGuesses).toBe('number');
    expect(typeof data.stats.averageAttempts).toBe('number');
  });

  test('returns 404 when game not found by date', async () => {
    const nonexistentDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]; // 1 year in the future
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/games?date=${nonexistentDate}`),
      { method: 'GET' }
    );
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe(ErrorCode.GameNotFound);
    expect(data.message).toBe((ErrorMessage[ErrorCode.GameNotFound] as (date: string) => string)(nonexistentDate));
  });
});

describe('POST /api/admin/games', () => {
  test('creates game with valid data', async () => {
    // Create song directly in database using fixture data
    await context.prisma.song.create({
      data: {
        spotifyId: validTrackId,
        lyrics: fixtures.genius.lyrics[validTrackKey],
        maskedLyrics: fixtures.genius.maskedLyrics[validTrackKey] as unknown as Prisma.InputJsonValue,
        spotifyData: fixtures.spotify.tracks[validTrackKey] as unknown as Prisma.InputJsonValue,
        geniusData: fixtures.genius.search[validTrackKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
      }
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/games'),
      {
        method: 'POST',
        body: JSON.stringify({ date, spotifyId: validTrackId })
      }
    );
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    integration_validator.game_service.createOrUpdate(data);
    // Validate game stats
    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('totalGuesses');
    expect(data.stats).toHaveProperty('correctGuesses');
    expect(data.stats).toHaveProperty('averageAttempts');
    expect(typeof data.stats.totalGuesses).toBe('number');
    expect(typeof data.stats.correctGuesses).toBe('number');
    expect(typeof data.stats.averageAttempts).toBe('number');
    // Verify game was created in database
    const game = await context.prisma.game.findUnique({ where: { date }, include: { song: true } });
    expect(game).toBeTruthy();
    const stats = {
      totalGuesses: 0,
      correctGuesses: 0,
      averageAttempts: 0,
      wins: 0,
      totalPlayers: 0,
      averageGuesses: 0,
      totalValidGuesses: 0,
      averageLyricsCompletionForWinners: 0,
      difficultyScore: 0,
    };
    integration_validator.game_service.createOrUpdate({ ...game!, stats });
  });

  test('returns 400 when date is invalid', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/games'),
      {
        method: 'POST',
        body: JSON.stringify({ date: 'invalid-date', spotifyId: validTrackId })
      }
    );
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });

  test('returns 400 when song ID is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/games'),
      {
        method: 'POST',
        body: JSON.stringify({ date })
      }
    );
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });
});

describe('DELETE /api/admin/games', () => {
  beforeEach(async () => {
    // Create song directly in database using fixture data
    const song = await context.prisma.song.create({
      data: {
        spotifyId: validTrackId,
        lyrics: fixtures.genius.lyrics[validTrackKey],
        maskedLyrics: fixtures.genius.maskedLyrics[validTrackKey] as unknown as Prisma.InputJsonValue,
        spotifyData: fixtures.spotify.tracks[validTrackKey] as unknown as Prisma.InputJsonValue,
        geniusData: fixtures.genius.search[validTrackKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
      }
    });

    await context.prisma.game.create({
      data: {
        date,
        songId: song.id
      }
    });
  });

  test('deletes game when found', async () => {
    // Debug: check if the game exists before DELETE
    const gameBefore = await context.prisma.game.findUnique({ where: { date } });
    // eslint-disable-next-line no-console
    console.log('DEBUG: Game before delete:', gameBefore);
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/games'),
      { 
        method: 'DELETE',
        body: JSON.stringify({ date })
      }
    );
    const response = await DELETE(request);
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
      new URL('http://localhost:3000/api/admin/games'),
      { 
        method: 'DELETE',
        body: JSON.stringify({ date: nonexistentDate })
      }
    );
    const response = await DELETE(request);
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe(ErrorCode.GameNotFound);
    expect(data.message).toBe((ErrorMessage[ErrorCode.GameNotFound] as (date: string) => string)(nonexistentDate));
  });

  test('returns 400 when date is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/games'),
      { 
        method: 'DELETE',
        body: JSON.stringify({})
      }
    );
    const response = await DELETE(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
  });
}); 