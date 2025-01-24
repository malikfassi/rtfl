import { NextRequest } from 'next/server';

import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { validators } from '@/app/api/lib/test/fixtures/core/validators';

import { GET } from '../route';

const validSongCase = TEST_CASES.SONGS.VALID;

describe('Spotify Tracks Search API Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  describe('GET /api/admin/spotify/tracks/search', () => {
    test('should return tracks when found by query', async () => {
      const track = validSongCase.spotify.getTrack();
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${track.name}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.tracks)).toBe(true);
      expect(data.tracks.length).toBeGreaterThan(0);
      validators.integration.spotifyTrack(data.tracks[0], track);
    }, 10000);

    test('should return empty array when no tracks found', async () => {
      const nonexistentQuery = 'nonexistent-song-name';
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${nonexistentQuery}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.tracks)).toBe(true);
      expect(data.tracks.length).toBe(0);
    }, 10000);

    test('should return 400 when query is missing', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/tracks/search'),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Expected string, received null');
    }, 10000);

    test('should return 400 when query is empty', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/tracks/search?q='),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Search query cannot be empty');
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
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('String must contain at most 100 character(s)');
    }, 10000);
  });
}); 