import { NextRequest } from 'next/server';
import { POST } from './route';
import { getGameByDate, createGuess } from '../../../../../lib/db';
import { getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';

jest.mock('../../../../../lib/db', () => ({
  getGameByDate: jest.fn(),
  createGuess: jest.fn(),
  getCachedSpotifyTrack: jest.fn(),
  getCachedLyricsBySpotifyId: jest.fn(),
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
    guesses: [],
  };

  const mockContext = {
    params: { date: mockDate },
    searchParams: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getGameByDate as jest.Mock).mockResolvedValue(mockGame);
    mockGetPlaylist.mockResolvedValue(mockPlaylist);
    mockGetLyricsBySpotifyId.mockResolvedValue(mockLyrics);
    (createGuess as jest.Mock).mockImplementation((args) => ({
      id: 'guess123',
      ...args,
      timestamp: new Date(),
      game: mockGame,
    }));
    (getCachedSpotifyTrack as jest.Mock).mockResolvedValue({
      spotifyId: mockTrack.id,
      data: JSON.stringify(mockTrack),
      updatedAt: new Date(),
    });
    (getCachedLyricsBySpotifyId as jest.Mock).mockResolvedValue({
      spotifyId: mockTrack.id,
      lyrics: mockLyrics,
      geniusId: 'genius123',
      updatedAt: new Date(),
    });
  });

  it('should create a correct guess when word matches', async () => {
    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        word: 'Test',
      }),
    });

    const response = await POST(request, mockContext);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.guess).toBeDefined();
    expect(data.maskedContent).toBeDefined();
  });

  it('should create an incorrect guess when word does not match', async () => {
    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        word: 'Wrong',
      }),
    });

    const response = await POST(request, mockContext);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.guess).toBeDefined();
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

    const response = await POST(request, mockContext);
    expect(response.status).toBe(400);
  });

  it('should return 404 when game not found', async () => {
    (getGameByDate as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        word: 'Test',
      }),
    });

    const response = await POST(request, mockContext);
    expect(response.status).toBe(404);
  });

  it('should return 404 when playlist not found', async () => {
    (getCachedSpotifyTrack as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        word: 'Test',
      }),
    });

    const response = await POST(request, mockContext);
    expect(response.status).toBe(404);
  });

  it('should return 404 when lyrics not found', async () => {
    (getCachedLyricsBySpotifyId as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: JSON.stringify({
        word: 'Test',
      }),
    });

    const response = await POST(request, mockContext);
    expect(response.status).toBe(404);
  });
});
