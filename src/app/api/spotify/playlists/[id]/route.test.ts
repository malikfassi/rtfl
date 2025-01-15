import { NextRequest } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { GET } from './route';

jest.mock('@/lib/spotify/auth', () => ({
  getSpotifyApi: jest.fn(),
}));

describe('GET /api/spotify/playlists/[id]', () => {
  const mockSpotifyApi = {
    playlists: {
      getPlaylist: jest.fn(),
      getPlaylistItems: jest.fn(),
    },
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
  };

  const mockTracks = {
    items: [
      {
        track: {
          id: 'track123',
          name: 'Test Track',
          type: 'track',
          artists: [{ name: 'Test Artist' }],
          preview_url: 'https://example.com/preview',
          album: {
            images: [{ url: 'https://example.com/album.jpg' }],
          },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);
  });

  it('should return playlist details', async () => {
    mockSpotifyApi.playlists.getPlaylist.mockResolvedValue(mockPlaylist);
    mockSpotifyApi.playlists.getPlaylistItems.mockResolvedValue(mockTracks);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/spotify/playlists/playlist123'),
    );
    const response = await GET(request, { params: { id: 'playlist123' } });
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
      tracks: [
        {
          id: mockTracks.items[0].track.id,
          name: mockTracks.items[0].track.name,
          artist: mockTracks.items[0].track.artists[0].name,
          previewUrl: mockTracks.items[0].track.preview_url,
          albumCover: mockTracks.items[0].track.album.images[0].url,
        },
      ],
    });

    expect(mockSpotifyApi.playlists.getPlaylist).toHaveBeenCalledWith('playlist123');
    expect(mockSpotifyApi.playlists.getPlaylistItems).toHaveBeenCalledWith('playlist123');
  });

  it('should handle missing playlist ID', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/spotify/playlists/'));
    const response = await GET(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Playlist ID is required' });
  });

  it('should handle API errors', async () => {
    mockSpotifyApi.playlists.getPlaylist.mockRejectedValue(new Error('API error'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/spotify/playlists/playlist123'),
    );
    const response = await GET(request, { params: { id: 'playlist123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get playlist' });
  });
});
