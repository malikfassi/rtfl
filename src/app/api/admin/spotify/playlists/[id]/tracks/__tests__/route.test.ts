import { NextRequest } from 'next/server';
import { GET } from '../route';
import { spotifyClient } from '@/lib/clients/spotify';

jest.mock('@/lib/clients/spotify', () => ({
  spotifyClient: {
    getPlaylistTracks: jest.fn()
  }
}));

describe('GET /api/admin/spotify/playlists/[id]/tracks', () => {
  it('should return tracks from a playlist', async () => {
    const mockTracks = [
      {
        id: 'track1',
        title: 'Test Track 1',
        artist: 'Test Artist 1'
      },
      {
        id: 'track2',
        title: 'Test Track 2',
        artist: 'Test Artist 2'
      }
    ];

    (spotifyClient.getPlaylistTracks as jest.Mock).mockResolvedValue(mockTracks);

    const request = new NextRequest(new URL('http://localhost:3000'));
    const context = { params: { id: 'playlist123' } };
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockTracks);
    expect(spotifyClient.getPlaylistTracks).toHaveBeenCalledWith('playlist123');
  });

  it('should handle errors', async () => {
    (spotifyClient.getPlaylistTracks as jest.Mock).mockRejectedValue(new Error('Failed to fetch tracks'));

    const request = new NextRequest(new URL('http://localhost:3000'));
    const context = { params: { id: 'playlist123' } };
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch playlist tracks' });
  });
}); 