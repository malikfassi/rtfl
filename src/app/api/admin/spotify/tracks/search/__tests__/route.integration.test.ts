import { NextRequest } from 'next/server';

import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';

import { GET } from '../route';

const validTrackKey = TRACK_KEYS.PARTY_IN_THE_USA;
const validTrack = fixtures.spotify.tracks[validTrackKey];

function getErrorMessage(msg: string | ((...args: any[]) => string), ...args: any[]): string {
  return typeof msg === 'function' ? msg(...args) : msg;
}

describe('Spotify Tracks Search API Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  describe('GET /api/admin/spotify/tracks/search', () => {
    test('should return tracks when found by query', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${validTrack.name}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.tracks)).toBe(true);
      expect(data.tracks.length).toBeGreaterThan(0);
      integration_validator.spotify_client.track(data.tracks[0], validTrackKey);
    }, 10000);

    test('should return 400 when query is missing', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/tracks/search'),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
    }, 10000);

    test('should return 400 when query is empty', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/tracks/search?q='),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
    }, 10000);

    test('should return 400 when query is too long', async () => {
      const longQuery = 'a'.repeat(300);
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${longQuery}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
    }, 10000);
  });
}); 