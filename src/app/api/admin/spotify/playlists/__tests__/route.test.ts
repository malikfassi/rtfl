import { NextRequest } from 'next/server';
import { GET } from '../route';
import { spotifyClient } from '@/lib/clients/spotify';

jest.mock('@/lib/clients/spotify');

describe('GET /api/admin/spotify/playlists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns playlists successfully', async () => {
    const mockPlaylists = [
      {
        id: 'playlist1',
        name: 'Test Playlist 1',
        description: 'Test Description 1',
        images: [{ url: 'http://example.com/image1.jpg' }]
      },
      {
        id: 'playlist2',
        name: 'Test Playlist 2',
        description: 'Test Description 2',
        images: [{ url: 'http://example.com/image2.jpg' }]
      }
    ];

    jest.spyOn(spotifyClient, 'getUserPlaylists').mockResolvedValue(mockPlaylists);

    const req = new NextRequest('http://localhost/api/admin/spotify/playlists');
    const response = await GET(req);
    
    expect(response?.status).toBe(200);
    const data = await response?.json();
    expect(data).toEqual(mockPlaylists);
  });

  it('handles Spotify API errors', async () => {
    jest.spyOn(spotifyClient, 'getUserPlaylists').mockRejectedValue(new Error('Spotify API error'));

    const req = new NextRequest('http://localhost/api/admin/spotify/playlists');
    const response = await GET(req);
    
    expect(response?.status).toBe(500);
    const data = await response?.json();
    expect(data.error).toBe('SPOTIFY_ERROR');
  });
}); 