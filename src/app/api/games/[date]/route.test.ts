import { createMockRequest } from '@/lib/test/mocks';
import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { type NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      findFirst: jest.fn(),
    },
    cachedSpotifyTrack: {
      findUnique: jest.fn(),
    },
    cachedGeniusLyrics: {
      findUnique: jest.fn(),
    },
  },
}));

const mockGetPlaylistItems = jest.fn();
jest.mock('@spotify/web-api-ts-sdk', () => ({
  SpotifyApi: {
    withClientCredentials: jest.fn().mockImplementation(() => ({
      playlists: {
        getPlaylistItems: mockGetPlaylistItems,
      },
    })),
  },
}));

describe('GET /api/games/[date]', () => {
  const mockContext = {
    params: { date: '2024-01-14' },
    searchParams: {},
  };

  const mockGame = {
    id: 'game1',
    date: new Date('2024-01-14'),
    playlistId: 'playlist1',
    overrideSongId: null,
    randomSeed: 'seed1',
    selectedTrackIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    guesses: [
      {
        id: 'guess1',
        userId: 'user1',
        gameId: 'game1',
        word: 'test',
        timestamp: new Date(),
        wasCorrect: true,
        game: null,
      },
    ],
  };

  const mockCachedTrack = {
    spotifyId: 'track1',
    data: JSON.stringify({
      name: 'Test Track',
      artists: [{ name: 'Test Artist' }],
      album: {
        images: [{ url: 'test.jpg' }]
      },
      preview_url: 'test.mp3'
    })
  };

  const mockCachedLyrics = {
    spotifyId: 'track1',
    lyrics: 'Test lyrics with Test word'
  };

  const mockPlaylist = {
    items: [
      {
        track: mockCachedTrack,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);
    (prisma.cachedSpotifyTrack.findUnique as jest.Mock).mockResolvedValue(mockCachedTrack);
    (prisma.cachedGeniusLyrics.findUnique as jest.Mock).mockResolvedValue(mockCachedLyrics);
    mockGetPlaylistItems.mockResolvedValue(mockPlaylist);
  });

  it('should return game state with user attempts', async () => {
    const request = createMockRequest('http://localhost:3000/api/games/2024-01-14') as unknown as NextRequest;
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: mockGame.id,
      date: mockGame.date.toISOString(),
      playlistId: mockGame.playlistId,
      overrideSongId: mockGame.overrideSongId,
      selectedTrackIndex: mockGame.selectedTrackIndex,
      randomSeed: mockGame.randomSeed,
      createdAt: mockGame.createdAt.toISOString(),
      updatedAt: mockGame.updatedAt.toISOString(),
      guesses: mockGame.guesses.map((g) => ({
        id: g.id,
        userId: g.userId,
        gameId: g.gameId,
        word: g.word,
        timestamp: g.timestamp.toISOString(),
        wasCorrect: g.wasCorrect,
        game: {
          id: mockGame.id,
          date: mockGame.date.toISOString(),
          playlistId: mockGame.playlistId,
          overrideSongId: mockGame.overrideSongId,
          selectedTrackIndex: mockGame.selectedTrackIndex,
          randomSeed: mockGame.randomSeed,
          createdAt: mockGame.createdAt.toISOString(),
          updatedAt: mockGame.updatedAt.toISOString(),
          guesses: [],
        },
      })),
      progress: {
        totalGuesses: mockGame.guesses.length,
        correctGuesses: mockGame.guesses.filter((g) => g.wasCorrect).length,
        isComplete: false,
      },
      hiddenSong: expect.any(Object),
    });
  });

  it('should return 404 when game not found', async () => {
    (prisma.game.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/games/2024-01-14') as unknown as NextRequest;
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Game not found' });
  });

  it('should return 404 when track not found', async () => {
    (prisma.cachedSpotifyTrack.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/games/2024-01-14') as unknown as NextRequest;
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Track not found' });
  });

  it('should return 404 when lyrics not found', async () => {
    (prisma.cachedGeniusLyrics.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/games/2024-01-14') as unknown as NextRequest;
    const response = await GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Lyrics not found' });
  });
});
