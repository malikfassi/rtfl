import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { GET } from '../route';

describe('Spotify Playlists Search API Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  describe('GET /api/admin/spotify/playlists/search', () => {
    test('should return playlists when found by query', async () => {
      // Get a known playlist from test case
      const testCase = TEST_CASES.PLAYLISTS.ROCK_CLASSICS;
      const playlist = testCase.spotify.getPlaylist();
      
      // Search using its name
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${playlist.name}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.playlists)).toBe(true);
      expect(data.playlists.length).toBeGreaterThan(0);
      
      // Verify the playlist is in the results
      const foundPlaylist = data.playlists.find((p: SimplifiedPlaylist) => p.id === testCase.id);
      expect(foundPlaylist).toBeDefined();
      expect(foundPlaylist?.name).toBe(playlist.name);
      expect(foundPlaylist?.id).toBe(playlist.id);
      expect(foundPlaylist?.owner.display_name).toBe(playlist.owner.display_name);
    }, 10000);

    test('should return empty array when no playlists found', async () => {
      const nonexistentQuery = 'xkcd1234nonexistentplaylist';
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${nonexistentQuery}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.playlists)).toBe(true);
      expect(data.playlists.length).toBe(0);
    }, 10000);

    test('should return 400 when query is missing', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/playlists/search'),
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
        new URL('http://localhost:3000/api/admin/spotify/playlists/search?q='),
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
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${longQuery}`),
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