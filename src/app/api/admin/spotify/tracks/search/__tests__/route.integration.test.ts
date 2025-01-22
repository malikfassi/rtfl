import { GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest, 
  spotifyData 
} from '@/lib/test';

describe('GET /api/admin/spotify/tracks/search Integration', () => {
  const track = Object.values(spotifyData.tracks)[0];

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  test('returns tracks when found', async () => {
    const query = track.name;
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    const firstTrack = data[0];
    expect(firstTrack).toHaveProperty('id');
    expect(firstTrack).toHaveProperty('name');
    expect(firstTrack).toHaveProperty('artists');
  });

  test('returns empty array for no matches', async () => {
    const query = 'thisisaveryrandomquerythatwontmatchanything12345';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  test('returns 400 when query is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Missing search query');
  });

  test('returns 400 when query is empty', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search?q=')
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
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
}); 