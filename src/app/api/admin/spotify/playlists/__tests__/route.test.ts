import { spotifyClient } from '@/lib/clients/spotify';
import { GET } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/clients/spotify', () => ({
  spotifyClient: {
    searchPlaylists: jest.fn()
  }
}));

describe('GET /api/admin/spotify/playlists', () => {
  const mockPlaylists = [
    {
      id: '1',
      name: 'Playlist 1',
      description: 'Description 1',
      trackCount: 10
    },
    {
      id: '2',
      name: 'Playlist 2',
      description: 'Description 2',
      trackCount: 20
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