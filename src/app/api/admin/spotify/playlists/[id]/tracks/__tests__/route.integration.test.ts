import { GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest, 
  spotifyData 
} from '@/lib/test';

describe('GET /api/admin/spotify/playlists/[id]/tracks Integration', () => {
  const [playlistId] = Object.entries(spotifyData.playlists)[0];

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  test('returns tracks when playlist exists', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`)
    );

    const response = await GET(request, { params: { id: playlistId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const firstTrack = data[0];
    expect(firstTrack).toHaveProperty('id');
    expect(firstTrack).toHaveProperty('name');
    expect(firstTrack).toHaveProperty('artists');
  });

  test('returns 404 when playlist does not exist', async () => {
    const nonexistentId = '1234567890abcdef1234567890abcdef';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${nonexistentId}/tracks`)
    );

    const response = await GET(request, { params: { id: nonexistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toBe('Playlist not found');
  });

  test('returns 400 for invalid playlist ID format', async () => {
    const invalidId = 'invalid-id';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${invalidId}/tracks`)
    );

    const response = await GET(request, { params: { id: invalidId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  test('handles empty playlists', async () => {
    // Use a known empty playlist from test data
    const emptyPlaylistId = Object.entries(spotifyData.playlists)
      .find(([_, playlist]) => playlist.tracks && playlist.tracks.total === 0)?.[0] || playlistId;

    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${emptyPlaylistId}/tracks`)
    );

    const response = await GET(request, { params: { id: emptyPlaylistId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('returns 500 when Spotify API fails unexpectedly', async () => {
    // Force an API error by using a valid format ID that doesn't exist
    const validFormatButNonexistentId = '1'.repeat(22);
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${validFormatButNonexistentId}/tracks`)
    );

    const response = await GET(request, { params: { id: validFormatButNonexistentId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('SPOTIFY_ERROR');
  });
}); 