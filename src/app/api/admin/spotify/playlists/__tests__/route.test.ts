import { GET } from '../route';
import { NextRequest } from 'next/server';
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

// Create a mock instance
const mockSpotifyClient = {
  searchPlaylists: jest.fn()
};

// Mock the spotify module
jest.mock('@/lib/clients/spotify', () => ({
  __esModule: true,
  getSpotifyClient: () => mockSpotifyClient
}));

describe('GET /api/admin/spotify/playlists', () => {
  const mockPlaylists: SimplifiedPlaylist[] = [
    {
      id: '1',
      name: 'Playlist 1',
      description: 'Description 1',
      tracks: { total: 10, href: '' },
      collaborative: false,
      external_urls: { spotify: '' },
      followers: { total: 0, href: null },
      href: '',
      images: [],
      owner: {
        display_name: 'Test User',
        external_urls: { spotify: '' },
        href: '',
        id: '',
        type: 'user',
        uri: ''
      },
      public: true,
      snapshot_id: '',
      type: 'playlist',
      uri: '',
      primary_color: ''
    },
    {
      id: '2',
      name: 'Playlist 2',
      description: 'Description 2',
      tracks: { total: 20, href: '' },
      collaborative: false,
      external_urls: { spotify: '' },
      followers: { total: 0, href: null },
      href: '',
      images: [],
      owner: {
        display_name: 'Test User',
        external_urls: { spotify: '' },
        href: '',
        id: '',
        type: 'user',
        uri: ''
      },
      public: true,
      snapshot_id: '',
      type: 'playlist',
      uri: '',
      primary_color: ''
    }
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns playlists successfully', async () => {
    // Mock the Spotify client
    mockSpotifyClient.searchPlaylists.mockResolvedValue(mockPlaylists);

    const response = await GET(
      new NextRequest('http://localhost/api/admin/spotify/playlists?q=test')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPlaylists);
    expect(mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith('test');
  });

  it('handles errors gracefully', async () => {
    // Mock the Spotify client to throw an error
    mockSpotifyClient.searchPlaylists.mockRejectedValue(new Error('Spotify API error'));

    const response = await GET(
      new NextRequest('http://localhost/api/admin/spotify/playlists?q=test')
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to search playlists' });
    expect(mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith('test');
  });
}); 