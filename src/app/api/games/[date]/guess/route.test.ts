import { createMockRequest } from '@/lib/test/mocks';
import { POST } from './route';
import { getGameByDate, createGuess } from '../../../../../lib/db';
import { getCachedSpotifyTrack, getCachedLyricsBySpotifyId } from '@/lib/db';
import { type NextRequest } from 'next/server';

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
  const mockContext = {
    params: { date: '2025-01-14' },
    searchParams: {},
  };

  const mockGame = {
    id: 'game1',
    date: new Date('2025-01-14'),
    playlistId: 'playlist123',
    overrideSongId: null,
    randomSeed: 'seed1',
    selectedTrackIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    guesses: [],
  };

  const mockTrack = {
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

  const mockLyrics = {
    spotifyId: 'track1',
    lyrics: 'Test lyrics with Test word'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getGameByDate as jest.Mock).mockResolvedValue(mockGame);
    (getCachedSpotifyTrack as jest.Mock).mockResolvedValue(mockTrack);
    (getCachedLyricsBySpotifyId as jest.Mock).mockResolvedValue(mockLyrics);
    (createGuess as jest.Mock).mockImplementation((data) => ({
      ...data,
      id: 'guess1',
      timestamp: new Date(),
      wasCorrect: data.word === 'Test',
    }));
  });

  it('should create a correct guess when word matches', async () => {
    const request = createMockRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: { word: 'Test' },
    }) as unknown as NextRequest;

    const response = await POST(request, mockContext);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.guess).toBeDefined();
    expect(data.maskedContent).toBeDefined();
  });

  it('should create an incorrect guess when word does not match', async () => {
    const request = createMockRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: { word: 'Wrong' },
    }) as unknown as NextRequest;

    const response = await POST(request, mockContext);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.guess).toBeDefined();
    expect(data.maskedContent).toBeDefined();
  });

  it('should return 400 for invalid request body', async () => {
    const request = createMockRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: {}, // Missing word
    }) as unknown as NextRequest;

    const response = await POST(request, mockContext);
    expect(response.status).toBe(400);
  });

  it('should return 404 when game not found', async () => {
    (getGameByDate as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: { word: 'Test' },
    }) as unknown as NextRequest;

    const response = await POST(request, mockContext);
    expect(response.status).toBe(404);
  });

  it('should return 404 when playlist not found', async () => {
    (getCachedSpotifyTrack as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: { word: 'Test' },
    }) as unknown as NextRequest;

    const response = await POST(request, mockContext);
    expect(response.status).toBe(404);
  });

  it('should return 404 when lyrics not found', async () => {
    (getCachedLyricsBySpotifyId as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/games/2025-01-14/guess', {
      method: 'POST',
      body: { word: 'Test' },
    }) as unknown as NextRequest;

    const response = await POST(request, mockContext);
    expect(response.status).toBe(404);
  });
});
