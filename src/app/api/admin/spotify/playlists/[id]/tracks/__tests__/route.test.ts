import { NextRequest } from 'next/server';
import { GET } from '../route';
import { spotifyClient } from '@/lib/clients/spotify';

jest.mock('@/lib/clients/spotify');

describe('GET /api/admin/spotify/playlists/[id]/tracks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns playlist tracks successfully', async () => {
    const mockPlaylist = {
      tracks: [
        {
          id: 'track1',
          name: 'Test Track 1',
          artists: [{ name: 'Test Artist 1' }],
          preview_url: 'http://example.com/preview1.mp3'
        },
        {
          id: 'track2',
          name: 'Test Track 2',
          artists: [{ name: 'Test Artist 2' }],
          preview_url: 'http://example.com/preview2.mp3'
        }
      ]
    };

    jest.spyOn(spotifyClient, 'getPlaylistTracks').mockResolvedValue(mockPlaylist);

    const req = new NextRequest('http://localhost/api/admin/spotify/playlists/playlist1/tracks');
    const segment = { params: { id: 'playlist1' } };
    const response = await GET(req, segment);
    
    expect(response?.status).toBe(200);
    const data = await response?.json();
    expect(data).toEqual(mockPlaylist);
    expect(spotifyClient.getPlaylistTracks).toHaveBeenCalledWith('playlist1');
  });

  it('handles Spotify API errors', async () => {
    jest.spyOn(spotifyClient, 'getPlaylistTracks').mockRejectedValue(new Error('Spotify API error'));

    const req = new NextRequest('http://localhost/api/admin/spotify/playlists/playlist1/tracks');
    const segment = { params: { id: 'playlist1' } };
    const response = await GET(req, segment);
    
    expect(response?.status).toBe(500);
    const data = await response?.json();
    expect(data.error).toBe('SPOTIFY_ERROR');
  });
}); 