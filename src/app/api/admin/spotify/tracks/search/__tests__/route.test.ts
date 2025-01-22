import { NextRequest } from 'next/server';
import { GET } from '../route';
import { spotifyData, setupUnitTest, cleanupUnitTest, type UnitTestContext } from '@/lib/test';
import { SpotifyError } from '@/lib/errors/spotify';

jest.mock('@/lib/clients/spotify');

describe('GET /api/admin/spotify/tracks/search', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  it('returns tracks when found', async () => {
    const query = 'test';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`)
    );

    const tracks = Object.values(spotifyData.tracks);
    context.mockSpotifyClient.searchTracks.mockResolvedValueOnce(tracks);

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(tracks);
    expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith(query);
  });

  it('returns empty array when no tracks found', async () => {
    const query = 'test';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`)
    );

    context.mockSpotifyClient.searchTracks.mockResolvedValueOnce([]);

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith(query);
  });

  it('returns 400 when query is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/search')
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Missing search query'
    });
  });

  it('returns 500 when search fails', async () => {
    const query = 'test';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`)
    );

    const error = new SpotifyError('Failed to search tracks');
    context.mockSpotifyClient.searchTracks.mockRejectedValueOnce(error);

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'SPOTIFY_ERROR',
      message: 'Failed to search tracks'
    });
    expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith(query);
  });
}); 