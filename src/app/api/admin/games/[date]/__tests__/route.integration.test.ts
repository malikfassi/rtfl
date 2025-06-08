import { NextRequest } from 'next/server';
import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { makeGET, makePOST } from '../route';

describe('Games by Date API Integration', () => {
  const validSongKey = TRACK_KEYS.PARTY_IN_THE_USA;
  const validSong = fixtures.spotify.tracks[validSongKey];
  const frenchSongKey = TRACK_KEYS.LA_VIE_EN_ROSE;
  const frenchSong = fixtures.spotify.tracks[frenchSongKey];
  const date = new Date().toISOString().split('T')[0];
  let context: Awaited<ReturnType<typeof setupIntegrationTest>>;

  function getErrorMessage(msg: string | ((...args: any[]) => string), ...args: any[]): string {
    return typeof msg === 'function' ? msg(...args) : msg;
  }

  beforeEach(async () => {
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('GET /api/admin/games/[date]', () => {
    beforeEach(async () => {
      const song = await context.songService.create(validSong.id);
      await context.gameService.createOrUpdate(date, song.id);
    });

    test('returns game when found', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`
      );

      const GET = makeGET(context.prisma);
      const response = await GET(request, { params: { date } });
      const data = await response.json();

      expect(response.status).toBe(200);
      integration_validator.game_service.createOrUpdate(data);
    });

    test('returns 404 when game not found', async () => {
      const nonexistentDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]; // 1 year in the future
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${nonexistentDate}`
      );

      const GET = makeGET(context.prisma);
      const response = await GET(request, { params: { date: nonexistentDate } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(ErrorCode.GameNotFound);
      expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.GameNotFound], nonexistentDate));
    });

    test('returns 400 for invalid date format', async () => {
      const invalidDate = 'invalid-date';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${invalidDate}`
      );

      const GET = makeGET(context.prisma);
      const response = await GET(request, { params: { date: invalidDate } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError], invalidDate));
    });
  });

  describe('POST /api/admin/games/[date]', () => {
    test('creates new game', async () => {
      // Debug: print the Spotify ID and its length
      // eslint-disable-next-line no-console
      console.log('DEBUG: validSong.id =', validSong.id, 'length =', validSong.id.length);
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: validSong.id
          })
        }
      );

      const POST = makePOST(context.prisma);
      const response = await POST(request, { params: { date } });
      const data = await response.json();

      expect(response.status).toBe(200);
      integration_validator.game_service.createOrUpdate(data);
    });

    test('updates existing game', async () => {
      const song1 = await context.songService.create(validSong.id);
      const song2 = await context.songService.create(frenchSong.id);
      await context.gameService.createOrUpdate(date, song1.id);
      const request = new NextRequest(
        `http://localhost:3000/api/admin/games/${date}`,
        {
          method: 'POST',
          body: JSON.stringify({
            spotifyId: frenchSong.id
          })
        }
      );

      const POST = makePOST(context.prisma);
      const response = await POST(request, { params: { date } });
      const data = await response.json();

      expect(response.status).toBe(200);
      integration_validator.game_service.createOrUpdate(data);
    });
  });
});