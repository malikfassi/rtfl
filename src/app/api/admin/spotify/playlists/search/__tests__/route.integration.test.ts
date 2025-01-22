import { GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest, 
  spotifyData 
} from '@/lib/test';

describe('GET /api/admin/spotify/playlists/search Integration', () => {
  const playlist = Object.values(spotifyData.playlists)[0];

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  test('returns playlists when found', async () => {
    const query = playlist.name;
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const firstPlaylist = data[0];
    expect(firstPlaylist).toHaveProperty('id');
    expect(firstPlaylist).toHaveProperty('name');
    expect(firstPlaylist).toHaveProperty('owner');
    expect(firstPlaylist).toHaveProperty('tracks');
  });

  test('returns empty array for no matches', async () => {
    const query = 'thisisaveryrandomquerythatwontmatchanything12345';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  test('returns 400 when query is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/search')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Missing search query');
  });

  test('returns 400 when query is empty', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/search?q=')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Missing search query');
  });

  test('handles special characters in search query', async () => {
    const query = 'test & special + characters';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('returns 500 when Spotify API fails', async () => {
    // Force an API error by using a very long query that might cause issues
    const query = 'a'.repeat(1000);
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('SPOTIFY_ERROR');
  });
}); 