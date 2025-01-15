import { NextRequest } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { GET } from './route';

jest.mock('@/lib/spotify/auth', () => ({
  getSpotifyApi: jest.fn(),
}));

describe('GET /api/spotify/playlists/search', () => {
  const mockSpotifyApi = {
    search: jest.fn(),
  };

  const mockPlaylist = {
    id: 'playlist123',
    name: 'Test Playlist',
    description: 'A test playlist',
    owner: {
      id: 'user123',
      display_name: 'Test User',
      external_urls: { spotify: 'https://spotify.com/user123' },
      href: 'https://api.spotify.com/v1/users/user123',
      type: 'user',
      uri: 'spotify:user:user123',
    },
    images: [
      {
        url: 'https://example.com/image.jpg',
        height: 300,
        width: 300,
      },
    ],
    collaborative: false,
    external_urls: { spotify: 'https://spotify.com/playlist123' },
    href: 'https://api.spotify.com/v1/playlists/playlist123',
    public: true,
    snapshot_id: 'abc123',
    type: 'playlist',
    uri: 'spotify:playlist:playlist123',
    primary_color: null,
    followers: { total: 0 },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);
  });

  it('should return search results', async () => {
    const searchResults = {
      playlists: {
        items: [mockPlaylist],
        total: 1,
        limit: 20,
        offset: 0,
        next: null,
        previous: null,
      },
    };

    mockSpotifyApi.search.mockResolvedValue(searchResults);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/spotify/playlists/search?query=test'),
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      items: [
        {
          id: mockPlaylist.id,
          name: mockPlaylist.name,
          description: mockPlaylist.description,
          owner: {
            id: mockPlaylist.owner.id,
            name: mockPlaylist.owner.display_name,
          },
          images: mockPlaylist.images,
          totalTracks: 0,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
      next: null,
      previous: null,
    });

    expect(mockSpotifyApi.search).toHaveBeenCalledWith('test', ['playlist'], undefined, 20, 0);
  });

  it('should handle invalid search parameters', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/spotify/playlists/search'));
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid search parameters' });
  });

  it('should handle API errors', async () => {
    mockSpotifyApi.search.mockRejectedValue(new Error('API error'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/spotify/playlists/search?query=test'),
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to search playlists' });
  });
});
