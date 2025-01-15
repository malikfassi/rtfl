import { NextRequest } from 'next/server';
import { createMockRequest } from '@/lib/test/mocks';
import { GET } from './route';
import { getSpotifyApi } from '@/lib/spotify/auth';

jest.mock('@/lib/spotify/auth');

describe('GET /api/spotify/playlists/[id]', () => {
  const mockPlaylist = {
    id: 'test-playlist',
    name: 'Test Playlist',
    description: 'A test playlist',
    owner: {
      id: 'test-user',
      display_name: 'Test User',
    },
    images: [],
    tracks: {
      total: 1,
      items: [
        {
          track: {
            id: 'test-track',
            name: 'Test Track',
            artists: [{ name: 'Test Artist' }],
          },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return playlist data', async () => {
    const mockSpotifyApi = {
      playlists: {
        getPlaylist: jest.fn().mockResolvedValue(mockPlaylist),
      },
    };
    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);

    const request = createMockRequest('/api/spotify/playlists/test-playlist') as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ id: 'test-playlist' }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      id: mockPlaylist.id,
      name: mockPlaylist.name,
      description: mockPlaylist.description,
      owner: {
        id: mockPlaylist.owner.id,
        name: mockPlaylist.owner.display_name,
      },
      images: mockPlaylist.images,
      totalTracks: mockPlaylist.tracks.total,
      tracks: [{
        id: mockPlaylist.tracks.items[0].track.id,
        name: mockPlaylist.tracks.items[0].track.name,
        artists: [mockPlaylist.tracks.items[0].track.artists[0].name],
      }],
    });
  });

  it('should return 500 for empty playlist ID', async () => {
    const request = createMockRequest('/api/spotify/playlists/') as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ id: '' }) });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Playlist ID is required');
  });

  it('should return 500 for Spotify API error', async () => {
    const mockSpotifyApi = {
      playlists: {
        getPlaylist: jest.fn().mockRejectedValue(new Error('API error')),
      },
    };
    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);

    const request = createMockRequest('/api/spotify/playlists/test-playlist') as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ id: 'test-playlist' }) });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to get playlist');
  });
});
