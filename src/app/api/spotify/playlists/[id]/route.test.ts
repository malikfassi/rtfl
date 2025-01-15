import { createMockRequest } from '@/lib/test/mocks';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { GET } from './route';
import { type NextRequest } from 'next/server';

jest.mock('@/lib/spotify/auth', () => ({
  getSpotifyApi: jest.fn(),
}));

describe('GET /api/spotify/playlists/[id]', () => {
  const mockSpotifyApi = {
    playlists: {
      getPlaylist: jest.fn(),
    },
  };

  const mockPlaylist = {
    id: 'playlist123',
    name: 'Test Playlist',
    description: 'A test playlist',
    owner: {
      id: 'user123',
      display_name: 'Test User',
    },
    images: [{ url: 'test.jpg' }],
    tracks: {
      total: 10,
      items: [
        {
          track: {
            id: 'track1',
            name: 'Test Track',
            artists: [{ name: 'Test Artist' }],
          },
        },
      ],
    },
  };

  const mockContext = {
    params: { id: 'playlist123' },
    searchParams: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);
  });

  it('should return playlist data', async () => {
    mockSpotifyApi.playlists.getPlaylist.mockResolvedValue(mockPlaylist);

    const request = createMockRequest('http://localhost:3000/api/spotify/playlists/playlist123') as unknown as NextRequest;
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: mockPlaylist.id,
      name: mockPlaylist.name,
      description: mockPlaylist.description,
      owner: {
        id: mockPlaylist.owner.id,
        name: mockPlaylist.owner.display_name,
      },
      images: mockPlaylist.images,
      totalTracks: mockPlaylist.tracks.total,
      tracks: mockPlaylist.tracks.items.map((item) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name),
      })),
    });
  });

  it('should handle empty playlist ID', async () => {
    const request = createMockRequest('http://localhost:3000/api/spotify/playlists/') as unknown as NextRequest;
    const response = await GET(request, { ...mockContext, params: { id: '' }, searchParams: {} });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get playlist' });
  });

  it('should handle Spotify API errors', async () => {
    (getSpotifyApi as jest.Mock).mockRejectedValue(new Error('Spotify API error'));

    const request = createMockRequest('http://localhost:3000/api/spotify/playlists/playlist123') as unknown as NextRequest;
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get playlist' });
  });
});
