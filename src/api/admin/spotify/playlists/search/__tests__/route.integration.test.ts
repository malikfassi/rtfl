import { GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest
} from '@/lib/test';

describe('GET /api/admin/spotify/playlists/search Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  it('returns playlists when found', async () => {
    const query = 'rock';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Test that each playlist has the required fields
    const firstPlaylist = data[0];
    expect(firstPlaylist).toHaveProperty('id');
    expect(firstPlaylist).toHaveProperty('name');
    expect(firstPlaylist).toHaveProperty('owner');
    expect(firstPlaylist).toHaveProperty('tracks');
  });

  it('returns 404 for no matches', async () => {
    const query = 'thisisaveryrandomquerythatwontmatchanything12345';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Spotify API error: No matching playlists found');
  });

  it('returns 400 when query is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/search')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameter: q');
  });

  it('returns 400 when query is empty', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/search?q=')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameter: q');
  });

  it('returns 400 when query contains only whitespace', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/search?q=%20%20%20')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Spotify API error: Search query is required');
  });
}); 