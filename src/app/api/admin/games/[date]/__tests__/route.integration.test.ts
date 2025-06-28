import { NextRequest } from 'next/server';
import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { GET, POST } from '../route';
import { Prisma } from '@prisma/client';

describe('Games by Date API Integration', () => {
  const validSongKey = TRACK_KEYS.PARTY_IN_THE_USA;
  const validSong = fixtures.spotify.tracks[validSongKey];
  const frenchSongKey = TRACK_KEYS.LA_VIE_EN_ROSE;
  const frenchSong = fixtures.spotify.tracks[frenchSongKey];
  const date = new Date().toISOString().split('T')[0];
  let context: Awaited<ReturnType<typeof setupIntegrationTest>>;

  beforeEach(async () => {
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('GET /api/admin/games/[date]', () => {
    beforeEach(async () => {
      // Create song and game directly in database using fixture data
      const song = await context.prisma.song.create({
        data: {
          spotifyId: validSong.id,
          lyrics: fixtures.genius.lyrics[validSongKey],
          maskedLyrics: fixtures.genius.maskedLyrics[validSongKey] as unknown as Prisma.InputJsonValue,
          spotifyData: validSong as unknown as Prisma.InputJsonValue,
          geniusData: fixtures.genius.search[validSongKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
        }
      });

      await context.prisma.game.create({
        data: {
          date,
          songId: song.id
        }
      });
    });

    test('returns game when found', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`
      );

      const response = await GET(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      integration_validator.game_service.createOrUpdate(data);
    });

    test('returns 404 when game not found', async () => {
      const nonexistentDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]; // 1 year in the future
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${nonexistentDate}`
      );

      const response = await GET(request, { params: Promise.resolve({ date: nonexistentDate }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(ErrorCode.GameNotFound);
      expect(data.message).toBe((ErrorMessage[ErrorCode.GameNotFound] as (date: string) => string)(nonexistentDate));
    });

    test('returns 400 for invalid date format', async () => {
      const invalidDate = 'invalid-date';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${invalidDate}`
      );

      const response = await GET(request, { params: Promise.resolve({ date: invalidDate }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
    });
  });

  describe('POST /api/admin/games/[date]', () => {
    test('creates new game', async () => {
      // Create song directly in database using fixture data
      await context.prisma.song.create({
        data: {
          spotifyId: validSong.id,
          lyrics: fixtures.genius.lyrics[validSongKey],
          maskedLyrics: fixtures.genius.maskedLyrics[validSongKey] as unknown as Prisma.InputJsonValue,
          spotifyData: validSong as unknown as Prisma.InputJsonValue,
          geniusData: fixtures.genius.search[validSongKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
        }
      });
      
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: validSong.id
          })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      integration_validator.game_service.createOrUpdate(data);
    });

    test('updates existing game', async () => {
      // Create both songs directly in database using fixture data
      const song1 = await context.prisma.song.create({
        data: {
          spotifyId: validSong.id,
          lyrics: fixtures.genius.lyrics[validSongKey],
          maskedLyrics: fixtures.genius.maskedLyrics[validSongKey] as unknown as Prisma.InputJsonValue,
          spotifyData: validSong as unknown as Prisma.InputJsonValue,
          geniusData: fixtures.genius.search[validSongKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
        }
      });

      await context.prisma.song.create({
        data: {
          spotifyId: frenchSong.id,
          lyrics: fixtures.genius.lyrics[frenchSongKey],
          maskedLyrics: fixtures.genius.maskedLyrics[frenchSongKey] as unknown as Prisma.InputJsonValue,
          spotifyData: frenchSong as unknown as Prisma.InputJsonValue,
          geniusData: fixtures.genius.search[frenchSongKey].response.hits[0].result as unknown as Prisma.InputJsonValue,
        }
      });

      // Create initial game with first song
      await context.prisma.game.create({
        data: {
          date,
          songId: song1.id
        }
      });
      
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: frenchSong.id
          })
        }
      );

      const response = await POST(request, { params: Promise.resolve({ date }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      integration_validator.game_service.createOrUpdate(data);
    });
  });
});