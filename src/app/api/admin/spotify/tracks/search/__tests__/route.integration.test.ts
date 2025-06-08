import { NextRequest } from 'next/server';
import type { Track } from '@spotify/web-api-ts-sdk';

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
      
      // Validate the structure of the first track
      const firstTrack = data.tracks[0];
      expect(typeof firstTrack.name).toBe('string');
      expect(typeof firstTrack.id).toBe('string');
      expect(typeof firstTrack.uri).toBe('string');
      expect(Array.isArray(firstTrack.artists)).toBe(true);
      expect(firstTrack.artists.length).toBeGreaterThan(0);
      expect(typeof firstTrack.artists[0].name).toBe('string');
      
      // Verify that the search results contain relevant tracks
      const hasRelevantTrack = data.tracks.some((t: Track) => {
        const name = t.name.toLowerCase();
        const artistName = t.artists[0].name.toLowerCase();
        return name.includes(validTrack.name.toLowerCase()) || 
               artistName.includes(validTrack.artists[0].name.toLowerCase());
      });
      expect(hasRelevantTrack).toBe(true);
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