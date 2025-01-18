import { NextRequest } from 'next/server';
import { GET } from '../route';
import { spotifyClient } from '@/lib/clients/spotify';
import type { Track } from '@spotify/web-api-ts-sdk';

jest.mock('@/lib/clients/spotify', () => ({
  spotifyClient: {
    getPlaylistTracks: jest.fn()
  }
}));

describe('GET /api/admin/spotify/playlists/[id]/tracks', () => {
  it('should return tracks from a playlist', async () => {
    const mockTracks: Track[] = [
      {
        id: 'track1',
        name: 'Test Track 1',
        artists: [{ id: 'artist1', name: 'Test Artist 1', type: 'artist', uri: '', href: '', external_urls: { spotify: '' } }],
        album: {
          id: 'album1',
          name: 'Test Album 1',
          images: [{ url: '', height: 300, width: 300 }],
          type: 'album',
          uri: '',
          href: '',
          external_urls: { spotify: '' },
          release_date: '',
          release_date_precision: 'day',
          total_tracks: 1,
          artists: [],
          album_group: 'album',
          album_type: 'album',
          available_markets: [],
          copyrights: [],
          external_ids: {
            upc: 'TEST123',
            isrc: 'TEST123',
            ean: 'TEST123'
          },
          genres: [],
          label: '',
          popularity: 0
        },
        preview_url: '',
        uri: '',
        external_urls: { spotify: '' },
        type: 'track',
        href: '',
        duration_ms: 0,
        explicit: false,
        external_ids: {
          upc: 'TEST123',
          isrc: 'TEST123',
          ean: 'TEST123'
        },
        is_local: false,
        popularity: 0,
        track_number: 1,
        disc_number: 1,
        available_markets: [],
        episode: false,
        track: true
      },
      {
        id: 'track2',
        name: 'Test Track 2',
        artists: [{ id: 'artist2', name: 'Test Artist 2', type: 'artist', uri: '', href: '', external_urls: { spotify: '' } }],
        album: {
          id: 'album2',
          name: 'Test Album 2',
          images: [{ url: '', height: 300, width: 300 }],
          type: 'album',
          uri: '',
          href: '',
          external_urls: { spotify: '' },
          release_date: '',
          release_date_precision: 'day',
          total_tracks: 1,
          artists: [],
          album_group: 'album',
          album_type: 'album',
          available_markets: [],
          copyrights: [],
          external_ids: {
            upc: 'TEST123',
            isrc: 'TEST123',
            ean: 'TEST123'
          },
          genres: [],
          label: '',
          popularity: 0
        },
        preview_url: '',
        uri: '',
        external_urls: { spotify: '' },
        type: 'track',
        href: '',
        duration_ms: 0,
        explicit: false,
        external_ids: {
          upc: 'TEST123',
          isrc: 'TEST123',
          ean: 'TEST123'
        },
        is_local: false,
        popularity: 0,
        track_number: 1,
        disc_number: 1,
        available_markets: [],
        episode: false,
        track: true
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