import { GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupUnitTest,
  cleanupUnitTest,
  type UnitTestContext,
  spotifyData
} from '@/lib/test';
import { SpotifyError } from '@/lib/errors/spotify';

// Mock the spotify client getter
jest.mock('@/lib/clients/spotify', () => ({
  ...jest.requireActual('@/lib/clients/spotify'),
  getSpotifyClient: jest.fn()
}));

describe('GET /api/admin/spotify/playlists/[id]/tracks', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  test('returns tracks when found', async () => {
    const { mockSpotifyClient } = context;
    const playlistId = 'playlist1';
    const tracks = Object.values(spotifyData.tracks);

    mockSpotifyClient.getPlaylistTracks.mockResolvedValue(tracks);

    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`)
    );

    const response = await GET(request, { params: { id: playlistId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(tracks);
    expect(mockSpotifyClient.getPlaylistTracks).toHaveBeenCalledWith(playlistId);
  });

  test('returns empty array when no tracks found', async () => {
    const { mockSpotifyClient } = context;
    const playlistId = 'empty-playlist';

    mockSpotifyClient.getPlaylistTracks.mockResolvedValue([]);

    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`)
    );

    const response = await GET(request, { params: { id: playlistId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockSpotifyClient.getPlaylistTracks).toHaveBeenCalledWith(playlistId);
  });

  test('returns 404 when playlist not found', async () => {
    const { mockSpotifyClient } = context;
    mockSpotifyClient.getPlaylistTracks.mockRejectedValue(new SpotifyError('Playlist not found'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/nonexistent/tracks')
    );

    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'NOT_FOUND',
      message: 'Playlist not found'
    });
  });

  test('returns 500 when get playlist tracks fails', async () => {
    const { mockSpotifyClient } = context;
    mockSpotifyClient.getPlaylistTracks.mockRejectedValue(new SpotifyError('API error'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/playlists/error/tracks')
    );

    const response = await GET(request, { params: { id: 'error' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'SPOTIFY_ERROR',
      message: 'API error'
    });
  });
}); 