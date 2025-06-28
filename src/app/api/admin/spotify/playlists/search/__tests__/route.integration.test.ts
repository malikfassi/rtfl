import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

import { PLAYLIST_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { GET } from '../route';

describe('Spotify Playlists Search API Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  }, 30000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 30000);

  describe('GET /api/admin/spotify/playlists/search', () => {
    test('should return playlists when found by query', async () => {
      const playlistKey = PLAYLIST_KEYS.ROCK_CLASSICS;
      const playlist = fixtures.spotify.playlists[playlistKey];
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(playlist.name)}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.playlists)).toBe(true);
      expect(data.playlists.length).toBeGreaterThan(0);
      
      // Validate the structure of the first playlist
      const firstPlaylist = data.playlists[0];
      expect(typeof firstPlaylist.name).toBe('string');
      expect(typeof firstPlaylist.id).toBe('string');
      expect(typeof firstPlaylist.uri).toBe('string');
      
      // Verify that the search results contain relevant playlists
      const hasRelevantPlaylist = data.playlists.some((p: SimplifiedPlaylist) => {
        const name = p.name.toLowerCase();
        return name.includes('rock') && name.includes('classic');
      });
      expect(hasRelevantPlaylist).toBe(true);
    }, 30000);

    test('should return 400 when query is missing', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/playlists/search'),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
    }, 30000);

    test('should return 400 when query is empty', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/playlists/search?q='),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
    }, 30000);

    test('should return 400 when query is too long', async () => {
      const longQuery = 'a'.repeat(300);
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${longQuery}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(ErrorCode.ValidationError);
      expect(data.message).toBe(ErrorMessage[ErrorCode.ValidationError]);
    }, 30000);
  });
}); 