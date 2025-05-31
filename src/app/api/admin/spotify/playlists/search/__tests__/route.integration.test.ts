import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

import { PLAYLIST_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { GET } from '../route';

function getErrorMessage(msg: string | ((...args: any[]) => string), ...args: any[]): string {
  return typeof msg === 'function' ? msg(...args) : msg;
}

describe('Spotify Playlists Search API Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  describe('GET /api/admin/spotify/playlists/search', () => {
    test('should return playlists when found by query', async () => {
      const playlistKey = PLAYLIST_KEYS.ROCK_CLASSICS;
      const playlist = fixtures.spotify.playlists[playlistKey];
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${playlist.name}`),
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.playlists)).toBe(true);
      expect(data.playlists.length).toBeGreaterThan(0);
      expect(typeof data.playlists[0].name).toBe('string');
      expect(data.playlists[0].name).toBe(playlist.name);
    }, 10000);

    test('should return 400 when query is missing', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/spotify/playlists/search'),
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
        new URL('http://localhost:3000/api/admin/spotify/playlists/search?q='),
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
        new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${longQuery}`),
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