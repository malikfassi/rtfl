import { NextRequest } from 'next/server';
import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { PLAYLIST_KEYS, PLAYLIST_URIS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';
import { GET } from '../route';

const playlistKey = PLAYLIST_KEYS.ROCK_CLASSICS;
const playlistUri = PLAYLIST_URIS[playlistKey];
const playlistId = playlistUri.split(':').pop()!;

function getErrorMessage(msg: string | ((...args: any[]) => string), ...args: any[]): string {
  return typeof msg === 'function' ? msg(...args) : msg;
}

describe('Spotify Playlist Tracks API Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  }, 10000);

  afterEach(async () => {
    await cleanupIntegrationTest();
  }, 10000);

  describe('GET /api/admin/spotify/playlists/[id]/tracks', () => {
    test('returns tracks when found by playlist id', async () => {
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`),
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: playlistId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.tracks)).toBe(true);
      expect(data.tracks.length).toBeGreaterThan(0);
      expect(typeof data.tracks[0].name).toBe('string');
    }, 10000);

    test('returns 404 when playlist not found', async () => {
      const nonexistentId = '3sTZTkIGgm8wJiSXDvpAaa';
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/${nonexistentId}/tracks`),
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: nonexistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(ErrorCode.PlaylistNotFound);
      expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.PlaylistNotFound], nonexistentId));
    }, 10000);
  });
}); 