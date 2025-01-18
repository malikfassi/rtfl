import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createGameService } from '@/lib/services/game';
import { createSongService } from '@/lib/services/song';
import { spotifyClient } from '@/lib/clients/spotify';
import type { Track } from '@spotify/web-api-ts-sdk';

jest.mock('@/lib/services/game', () => ({
  createGameService: jest.fn()
}));

jest.mock('@/lib/services/song', () => ({
  createSongService: jest.fn()
}));

jest.mock('@/lib/clients/spotify', () => ({
  spotifyClient: {
    getTrack: jest.fn()
  }
}));

describe('GET /api/admin/games', () => {
  const mockGame = {
    id: '1',
    date: '2024-01-01',
    songId: '1',
    createdAt: new Date('2025-01-16T16:37:02.951Z'),
    updatedAt: new Date('2025-01-16T16:37:02.951Z'),
    song: {
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist',
      lyrics: 'Test lyrics',
      maskedLyrics: {
        title: 'T*** S***',
        artist: 'T*** A*****',
        lyrics: 'T*** l*****'
      },
      spotifyId: 'spotify:track:1',
      previewUrl: 'https://test.com/preview.mp3',
      createdAt: new Date('2025-01-16T16:37:02.951Z'),
      updatedAt: new Date('2025-01-16T16:37:02.951Z')
    }
  };

  const mockGames = [mockGame];
  const mockGameService = {
    getByDate: jest.fn(),
    getByMonth: jest.fn()
  };

  beforeEach(() => {
    (createGameService as jest.Mock).mockReturnValue(mockGameService);
    (createSongService as jest.Mock).mockReturnValue({});
  });

  it('returns games for a given month', async () => {
    mockGameService.getByMonth.mockResolvedValue(mockGames);
    
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?month=2024-01'));
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockGames.map(game => ({
      ...game,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      song: {
        ...game.song,
        createdAt: game.song.createdAt.toISOString(),
        updatedAt: game.song.updatedAt.toISOString()
      }
    })));
  });

  it('returns a game for a given date', async () => {
    mockGameService.getByDate.mockResolvedValue(mockGame);
    
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?date=2024-01-01'));
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      ...mockGame,
      createdAt: mockGame.createdAt.toISOString(),
      updatedAt: mockGame.updatedAt.toISOString(),
      song: {
        ...mockGame.song,
        createdAt: mockGame.song.createdAt.toISOString(),
        updatedAt: mockGame.song.updatedAt.toISOString()
      }
    });
  });

  it('returns 404 when game is not found', async () => {
    mockGameService.getByDate.mockRejectedValue(new Error('NOT_FOUND: Game not found for date: 2024-01-01'));
    
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?date=2024-01-01'));
    const response = await GET(req);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'NOT_FOUND', message: 'NOT_FOUND: Game not found for date: 2024-01-01' });
  });

  it('returns 400 for invalid month format', async () => {
    mockGameService.getByMonth.mockRejectedValue(new Error('INVALID_FORMAT: Invalid month format'));
    
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games?month=invalid'));
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'INVALID_FORMAT', message: 'INVALID_FORMAT: Invalid month format' });
  });
});

describe('POST /api/admin/games', () => {
  const mockGame = {
    id: '1',
    date: '2024-01-01',
    songId: '1',
    song: {
      id: '1',
      spotifyId: '1234567890abcdef1234',
      title: 'Test Song',
      artist: 'Test Artist',
      lyrics: 'Test lyrics',
      maskedLyrics: {
        title: 'T*** S***',
        artist: 'T*** A*****',
        lyrics: 'T*** l*****'
      },
      previewUrl: 'https://test.com/preview.mp3',
      createdAt: new Date('2025-01-16T16:37:02.951Z'),
      updatedAt: new Date('2025-01-16T16:37:02.951Z')
    },
    createdAt: new Date('2025-01-16T16:37:02.951Z'),
    updatedAt: new Date('2025-01-16T16:37:02.951Z')
  };

  const mockGameService = {
    createOrUpdate: jest.fn()
  };

  const mockSpotifyTrack: Track = {
    id: '1234567890abcdef1234',
    name: 'Test Song',
    artists: [{ id: 'artist1', name: 'Test Artist', type: 'artist', uri: '', href: '', external_urls: { spotify: '' } }],
    album: {
      id: 'album1',
      name: 'Test Album',
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
    preview_url: 'https://test.com/preview.mp3',
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
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (createGameService as jest.Mock).mockReturnValue(mockGameService);
    (createSongService as jest.Mock).mockReturnValue({});
    (spotifyClient.getTrack as jest.Mock).mockResolvedValue(mockSpotifyTrack);
  });

  it('creates a new game with valid data', async () => {
    mockGameService.createOrUpdate.mockResolvedValue(mockGame);
    
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games'), {
      method: 'POST',
      body: JSON.stringify({
        date: '2024-01-01',
        spotifyId: '1234567890abcdef1234'
      })
    });
    
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      ...mockGame,
      createdAt: mockGame.createdAt.toISOString(),
      updatedAt: mockGame.updatedAt.toISOString(),
      song: {
        ...mockGame.song,
        createdAt: mockGame.song.createdAt.toISOString(),
        updatedAt: mockGame.song.updatedAt.toISOString()
      }
    });
  });

  it('returns 400 for missing required fields', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/admin/games'), {
      method: 'POST',
      body: JSON.stringify({ date: '2024-01-01' })
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({
      error: 'MISSING_PARAMS',
      message: 'date and spotifyId are required'
    });
  });
}); 