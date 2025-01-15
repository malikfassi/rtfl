import { NextRequest } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { GET } from './route';

jest.mock('@/lib/spotify/auth', () => ({
  getSpotifyApi: jest.fn(),
}));

describe('GET /api/spotify/playlists/[id]', () => {
  const mockContext = {
    params: { id: 'playlist123' },
    searchParams: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return playlist data', async () => {
    const mockPlaylist = {
      id: 'playlist123',
      name: 'Test Playlist',
      description: 'A test playlist',
      owner: {
        id: 'user123',
        display_name: 'Test User',
      },
      images: [{ url: 'https://example.com/cover.jpg' }],
      tracks: {
        items: [
          {
            track: {
              id: 'track123',
              name: 'Test Song',
              artists: [{ name: 'Test Artist' }],
              preview_url: 'https://example.com/preview',
              album: {
                images: [{ url: 'https://example.com/cover.jpg' }],
              },
            },
          },
        ],
      },
    };

    (getSpotifyApi as jest.Mock).mockResolvedValue({
      playlists: {
        getPlaylist: jest.fn().mockResolvedValue(mockPlaylist),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/spotify/playlists/playlist123');
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPlaylist);
  });

  it('should handle empty playlist ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/spotify/playlists/');
    const response = await GET(request, { ...mockContext, params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get playlist' });
  });

  it('should handle Spotify API errors', async () => {
    (getSpotifyApi as jest.Mock).mockRejectedValue(new Error('Spotify API error'));

    const request = new NextRequest('http://localhost:3000/api/spotify/playlists/playlist123');
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get playlist' });
  });
});
