import { NextRequest } from 'next/server';

import { cleanupIntegrationTest, setupIntegrationTest } from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { PLAYLIST_IDS } from '@/app/api/lib/test/fixtures/spotify_ids';

import { GET } from '../route';

// Use ROCK_CLASSICS which should have test data in the fixtures
const validPlaylistCase = TEST_CASES.PLAYLISTS.ROCK_CLASSICS;

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
        new URL(`http://localhost:3000/api/admin/spotify/playlists/${validPlaylistCase.id}/tracks`),
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: validPlaylistCase.id }) });
      const data = await response.json();

      // Let's check the actual structure
      console.log('Response data:', JSON.stringify(data, null, 2));

      expect(response.status).toBe(200);
      // Assuming the response has a tracks property that contains the array
      expect(Array.isArray(data.tracks)).toBe(true);
      expect(data.tracks.length).toBeGreaterThan(0);
      
      validPlaylistCase.validators.integration.tracks(data.tracks);
    }, 10000);

    test('returns 404 when playlist not found', async () => {
      // Use a properly formatted but non-existent Spotify playlist ID
      const nonexistentId = '3sTZTkIGgm8wJiSXDvpAaa';  // Same format as valid IDs
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/admin/spotify/playlists/${nonexistentId}/tracks`),
        { method: 'GET' }
      );

      const response = await GET(request, { params: Promise.resolve({ id: nonexistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe(`Playlist not found: ${nonexistentId}`);
    }, 10000);
  });
}); 