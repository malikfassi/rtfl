import { spotifyClient } from '@/lib/clients/spotify';
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('GET /api/admin/spotify/playlists/[id]/tracks', () => {
  const mockTracks = [
    {
      id: '1',
      name: 'Track 1',
      artists: [{ name: 'Artist 1' }],
      preview_url: 'http://example.com/preview1.mp3'
    },
    {
      id: '2',
      name: 'Track 2',
      artists: [{ name: 'Artist 2' }],
      preview_url: 'http://example.com/preview2.mp3'
    }
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns tracks successfully', async () => {
    // Mock the Spotify client
    jest.spyOn(spotifyClient, 'getPlaylistTracks').mockResolvedValue(mockTracks);

    const response = await GET(
      new NextRequest('http://localhost/api/admin/spotify/playlists/123/tracks'),
      { params: { id: '123' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockTracks);
  });

  it('handles errors gracefully', async () => {
    // Mock the Spotify client to throw an error
    jest.spyOn(spotifyClient, 'getPlaylistTracks').mockRejectedValue(new Error('Spotify API error'));

    const response = await GET(
      new NextRequest('http://localhost/api/admin/spotify/playlists/123/tracks'),
      { params: { id: '123' } }
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get playlist tracks' });
  });
}); 