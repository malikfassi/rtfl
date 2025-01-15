import { createMockRequest } from '@/lib/test/mocks';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { GET } from './route';
import { type NextRequest } from 'next/server';

jest.mock('@/lib/spotify/auth', () => ({
  getSpotifyApi: jest.fn(),
}));

describe('GET /api/spotify/playlists/search', () => {
  const mockSpotifyApi = {
    search: jest.fn(),
  };

  const mockPlaylist = {
    id: 'playlist123',
    name: 'Test Playlist',
    description: 'A test playlist',
    owner: {
      id: 'user123',
      display_name: 'Test User',
    },
    images: [{ url: 'test.jpg' }],
    tracks: {
      total: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);
    mockSpotifyApi.search.mockImplementation((query, types, market, limit, offset) => {
      if (!query) {
        throw new Error('Invalid search parameters');
      }
      return Promise.resolve({
        playlists: {
          items: [mockPlaylist],
          total: 1,
          limit: limit || 20,
          offset: offset || 0,
        },
      });
    });
  });

  it('should search playlists', async () => {
    const searchResults = {
      playlists: {
        items: [mockPlaylist],
        total: 1,
        limit: 20,
        offset: 0,
      },
    };

    mockSpotifyApi.search.mockResolvedValue(searchResults);

    const request = createMockRequest(
      'http://localhost:3000/api/spotify/playlists/search?query=test'
    ) as unknown as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items[0]).toEqual({
      id: mockPlaylist.id,
      name: mockPlaylist.name,
      description: mockPlaylist.description,
      owner: {
        id: mockPlaylist.owner.id,
        name: mockPlaylist.owner.display_name,
      },
      images: mockPlaylist.images,
      totalTracks: mockPlaylist.tracks.total,
    });
  });

  it('should handle invalid search parameters', async () => {
    const request = createMockRequest(
      'http://localhost:3000/api/spotify/playlists/search'
    ) as unknown as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid search parameters' });
  });

  it('should handle API errors', async () => {
    mockSpotifyApi.search.mockRejectedValue(new Error('API error'));

    const request = createMockRequest(
      'http://localhost:3000/api/spotify/playlists/search?query=test'
    ) as unknown as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to search playlists' });
  });

  it('should handle null playlist items', async () => {
    const searchResults = {
      playlists: {
        items: [null, mockPlaylist, undefined],
        total: 3,
        limit: 20,
        offset: 0,
      },
    };

    mockSpotifyApi.search.mockResolvedValue(searchResults);

    const request = createMockRequest(
      'http://localhost:3000/api/spotify/playlists/search?query=test'
    ) as unknown as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe(mockPlaylist.id);
  });
});
