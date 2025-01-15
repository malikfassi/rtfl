import { NextRequest } from 'next/server';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return game state with user attempts', async () => {
    const mockGame = {
      id: 'game1',
      date: new Date('2024-01-14'),
      playlistId: 'playlist1',
      overrideSongId: null,
      selectedTrackIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      guesses: [
        {
          id: 'guess1',
          gameId: 'game1',
          userId: 'user1',
          word: 'Test Guess',
          wasCorrect: false,
          timestamp: new Date(),
        },
      ],
    };

    const mockTrack = {
      id: 'track123',
      name: 'Test Song',
      artists: [{ name: 'Test Artist' }],
      preview_url: 'https://example.com/preview',
      album: {
        images: [{ url: 'https://example.com/cover.jpg' }],
      },
    };

    const mockPlaylist = {
      items: [
        {
          track: mockTrack,
        },
      ],
    };

    const mockCachedTrack = {
      spotifyId: mockTrack.id,
      data: JSON.stringify(mockTrack),
      updatedAt: new Date(),
    };

    const mockCachedLyrics = {
      spotifyId: mockTrack.id,
      lyrics: 'Test lyrics for the song',
      geniusId: 'genius123',
      updatedAt: new Date(),
    };

    (prisma.game.findFirst as jest.Mock).mockResolvedValue(mockGame);
    (prisma.cachedSpotifyTrack.findUnique as jest.Mock).mockResolvedValue(mockCachedTrack);
    (prisma.cachedGeniusLyrics.findUnique as jest.Mock).mockResolvedValue(mockCachedLyrics);
    mockGetPlaylistItems.mockResolvedValue(mockPlaylist);

    const request = new NextRequest('http://localhost:3000/api/games/2024-01-14');
    const response = await GET(request, { params: { date: '2024-01-14' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: mockGame.id,
      date: mockGame.date.toISOString(),
      playlistId: mockGame.playlistId,
      overrideSongId: mockGame.overrideSongId,
      selectedTrackIndex: mockGame.selectedTrackIndex,
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
});
