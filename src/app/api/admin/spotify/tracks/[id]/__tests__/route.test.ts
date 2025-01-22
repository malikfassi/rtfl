import { GET } from '../route';
import { NextRequest } from 'next/server';
import { setupUnitTest, type UnitTestContext, spotifyData } from '@/lib/test';
import { SpotifyError } from '@/lib/errors/spotify';

jest.mock('@/lib/clients/spotify');

describe('GET /api/admin/spotify/tracks/[id]', () => {
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
  });

  test('returns track when found', async () => {
    const { mockSpotifyClient } = context;
    const trackId = Object.keys(spotifyData.tracks)[0];
    const track = spotifyData.tracks[trackId];

    mockSpotifyClient.getTrack.mockResolvedValue(track);

    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${trackId}`)
    );

    const response = await GET(request, { params: { id: trackId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(track);
    expect(mockSpotifyClient.getTrack).toHaveBeenCalledWith(trackId);
  });

  test('returns 404 when track not found', async () => {
    const { mockSpotifyClient } = context;
    mockSpotifyClient.getTrack.mockRejectedValue(new SpotifyError('Track not found'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/nonexistent')
    );

    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'NOT_FOUND',
      message: 'Track not found'
    });
  });

  test('returns 500 when get track fails', async () => {
    const { mockSpotifyClient } = context;
    mockSpotifyClient.getTrack.mockRejectedValue(new SpotifyError('API error'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/spotify/tracks/error')
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