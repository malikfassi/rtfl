import { spotifyClient } from '@/lib/clients/spotify';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

jest.mock('@/lib/clients/spotify', () => ({
  spotifyClient: {
    searchPlaylists: jest.fn()
  }
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
    jest.spyOn(spotifyClient, 'searchPlaylists').mockResolvedValue(mockPlaylists);

    const response = await GET(
      new NextRequest('http://localhost/api/admin/spotify/playlists?q=test')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPlaylists);
    expect(spotifyClient.searchPlaylists).toHaveBeenCalledWith('test');
  });

  it('handles errors gracefully', async () => {
    // Mock the Spotify client to throw an error
    jest.spyOn(spotifyClient, 'searchPlaylists').mockRejectedValue(new Error('Spotify API error'));

    const response = await GET(
      new NextRequest('http://localhost/api/admin/spotify/playlists?q=test')
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to search playlists' });
    expect(spotifyClient.searchPlaylists).toHaveBeenCalledWith('test');
  });
}); 