import { NextRequest } from 'next/server';
import { GET } from '../route';
import { TEST_CASES } from '@/lib/test/fixtures/core/test_cases';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/lib/test';
import type { Track } from '@spotify/web-api-ts-sdk';

describe('GET /api/admin/spotify/tracks/search Integration', () => {
  const validSongCase = TEST_CASES.SONGS.VALID;
  const spotifyTrack = validSongCase.spotify.getTrack();

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  it('returns tracks when found', async () => {
    const searchQuery = spotifyTrack.name;
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(searchQuery)}`)
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Test first track matches fixture data
    const matchingTrack = data.find((track: Track) => track.id === spotifyTrack.id);
    expect(matchingTrack).toBeDefined();
    expect(matchingTrack).toMatchObject({
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      artists: spotifyTrack.artists,
      album: expect.objectContaining({
        name: spotifyTrack.album.name,
        images: spotifyTrack.album.images,
      })
    });
  });

  it('returns 404 for no matches', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search?q=thisisaveryrandomquerythatwontmatching12345')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'No matching tracks found'
    });
  });

  it('returns 400 when query is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing required parameter: q'
    });
  });

  it('returns 400 when query is empty', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search?q=')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing required parameter: q'
    });
  });

  it('handles special characters in search query', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search?q=test%20%26%20special%20%2B%20characters')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'No matching tracks found'
    });
  });
}); 