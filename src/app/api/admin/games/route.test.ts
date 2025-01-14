import { GET } from './route';
import { prisma } from '../../../../lib/db';

// Mock Prisma
jest.mock('../../../../lib/db', () => ({
  prisma: {
    gameConfig: {
      findMany: jest.fn(),
    },
  },
}));

// Mock Cache Service
jest.mock('../../../../lib/cache', () => {
  const mockGetPlaylist = jest.fn().mockImplementation((spotifyId: string) => {
    if (spotifyId === 'playlist1') {
      return Promise.resolve({
        id: 'playlist1',
        name: 'Test Playlist',
        tracks: [
          {
            id: 'track1',
            name: 'Test Track',
            artists: ['Test Artist'],
            lyrics: 'Test lyrics',
          },
        ],
      });
    }
    return Promise.resolve(null);
  });

  return {
    CacheService: jest.fn().mockImplementation(() => ({
      getPlaylist: mockGetPlaylist,
    })),
  };
});

describe('GET /api/admin/games', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns enriched game configs', async () => {
    // Mock database response
    (prisma.gameConfig.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        playlistId: 'playlist1',
        guesses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Make request
    const response = await GET();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({
      id: '1',
      playlistId: 'playlist1',
      playlist: {
        id: 'playlist1',
        name: 'Test Playlist',
        tracks: [
          {
            id: 'track1',
            name: 'Test Track',
            artists: ['Test Artist'],
            lyrics: 'Test lyrics',
          },
        ],
      },
      guesses: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('handles missing cache data', async () => {
    // Mock database response
    (prisma.gameConfig.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        playlistId: 'missing_playlist',
        guesses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Make request
    const response = await GET();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to list game configs' });
  });

  it('handles database errors', async () => {
    // Mock database error
    (prisma.gameConfig.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Make request
    const response = await GET();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to list game configs' });
  });
});
