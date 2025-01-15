import { NextRequest } from 'next/server';
import { POST } from './route';
import { prisma } from '../../../../../lib/prisma';
import { getGameByDate } from '../../../../../lib/db';

jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    guess: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    game: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../../../../lib/db', () => ({
  getGameByDate: jest.fn(),
}));

const mockGetPlaylist = jest.fn();
jest.mock('../../../../../lib/spotify/auth', () => ({
  getSpotifyApi: jest.fn().mockImplementation(() => ({
    playlists: {
      getPlaylist: mockGetPlaylist,
    },
  })),
}));

const mockGetLyricsBySpotifyId = jest.fn();
jest.mock('../../../../../lib/cache', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    getLyricsBySpotifyId: mockGetLyricsBySpotifyId,
  })),
}));

describe('POST /api/games/[date]/guess', () => {
  const mockDate = '2025-01-14';
  const mockUserId = 'user123';
  const mockGameId = 'game123';
  const mockTrack = {
    id: 'track123',
    name: 'Test Song',
    artists: [{ name: 'Test Artist' }],
    preview_url: 'https://example.com/preview',
  };
  const mockPlaylist = {
    id: 'playlist123',
    name: 'Test Playlist',
    tracks: {
      items: [{ track: mockTrack }],
    },
  };
  const mockLyrics = 'Test lyrics for the song';
  const mockGame = {
    id: mockGameId,
    date: new Date(mockDate),
    playlistId: mockPlaylist.id,
    selectedTrackIndex: 0,
    overrideSongId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getGameByDate as jest.Mock).mockResolvedValue(mockGame);
    mockGetPlaylist.mockResolvedValue(mockPlaylist);
    mockGetLyricsBySpotifyId.mockResolvedValue(mockLyrics);
    (prisma.guess.create as jest.Mock).mockImplementation((args) => ({
      id: 'guess123',
      ...args.data,
      timestamp: new Date(),
      game: mockGame,
    }));
  });

  it('should create a correct guess when word matches', async () => {
    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        word: 'Test',
      }),
    });

    const response = await POST(request, { params: { date: mockDate } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.guess.create).toHaveBeenCalledWith({
      data: {
        userId: mockUserId,
        game: {
          connect: {
            id: mockGameId,
          },
        },
        wasCorrect: true,
        word: 'Test',
      },
      include: {
        game: true,
      },
    });
    expect(data.guess.isCorrect).toBe(true);
    expect(data.maskedContent).toBeDefined();
  });

  it('should create an incorrect guess when word does not match', async () => {
    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        word: 'Wrong',
      }),
    });

    const response = await POST(request, { params: { date: mockDate } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.guess.create).toHaveBeenCalledWith({
      data: {
        userId: mockUserId,
        game: {
          connect: {
            id: mockGameId,
          },
        },
        wasCorrect: false,
        word: 'Wrong',
      },
      include: {
        game: true,
      },
    });
    expect(data.guess.isCorrect).toBe(false);
    expect(data.maskedContent).toBeDefined();
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        // Missing word
      }),
    });

    const response = await POST(request, { params: { date: mockDate } });
    expect(response.status).toBe(400);
  });

  it('should return 404 when game not found', async () => {
    (getGameByDate as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        word: 'Test',
      }),
    });

    const response = await POST(request, { params: { date: mockDate } });
    expect(response.status).toBe(404);
  });

  it('should return 404 when playlist not found', async () => {
    mockGetPlaylist.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        word: 'Test',
      }),
    });

    const response = await POST(request, { params: { date: mockDate } });
    expect(response.status).toBe(404);
  });

  it('should return 404 when lyrics not found', async () => {
    mockGetLyricsBySpotifyId.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        word: 'Test',
      }),
    });

    const response = await POST(request, { params: { date: mockDate } });
    expect(response.status).toBe(404);
  });
});
