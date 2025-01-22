import { NextRequest } from 'next/server';
import { GET } from '../route';
import { 
  setupUnitTest,
  cleanupUnitTest,
  type UnitTestContext,
  spotifyData
} from '@/lib/test';
import { SpotifyError } from '@/lib/errors/spotify';

// Mock the entire spotify module
jest.mock('@/lib/clients/spotify', () => ({
  ...jest.requireActual('@/lib/clients/spotify'),
  getSpotifyClient: jest.fn()
}));

describe('GET /api/admin/spotify/playlists/search', () => {
  let context: UnitTestContext;
  const playlistId = Object.keys(spotifyData.playlists)[0];
  const playlist = spotifyData.playlists[playlistId];

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  test('returns playlists when found', async () => {
    const { mockSpotifyClient } = context;
    const query = playlist.name;
    const playlists = [playlist];

    jest.spyOn(mockSpotifyClient, 'searchPlaylists').mockResolvedValue(playlists);

    const request = new NextRequest(
      new URL(`http://localhost/api/admin/spotify/playlists/search?q=${query}`)
    );

    const response = await GET(request, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(playlists);
    expect(mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith(query);
  });

  test('returns empty array when no playlists found', async () => {
    const { mockSpotifyClient } = context;
    const query = 'nonexistent playlist';

    jest.spyOn(mockSpotifyClient, 'searchPlaylists').mockResolvedValue([]);

    const request = new NextRequest(
      new URL(`http://localhost/api/admin/spotify/playlists/search?q=${query}`)
    );

    const response = await GET(request, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith(query);
  });

  test('returns 400 when query is missing', async () => {
    const request = new NextRequest(
      new URL('http://localhost/api/admin/spotify/playlists/search')
    );

    const response = await GET(request, {});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'INVALID_REQUEST',
      message: 'Missing search query'
    });
  });

  test('returns 500 when search fails', async () => {
    const { mockSpotifyClient } = context;
    const query = playlist.name;

    jest.spyOn(mockSpotifyClient, 'searchPlaylists').mockRejectedValue(new SpotifyError('API error'));

    const request = new NextRequest(
      new URL(`http://localhost/api/admin/spotify/playlists/search?q=${query}`)
    );

    const response = await GET(request, {});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'SPOTIFY_ERROR',
      message: 'API error'
    });
  });
}); 