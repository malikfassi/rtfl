# Testing Documentation

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── admin/        # Admin API endpoints
│   │   └── game/         # Game API endpoints
│   ├── admin/            # Admin pages
│   └── game/             # Game pages
├── components/            # React components
│   ├── admin/            # Admin components
│   └── game/             # Game components
├── lib/                   # Core business logic
│   ├── services/         # Business logic services
│   │   ├── game.ts
│   │   ├── song.ts
│   │   └── stats.ts
│   ├── clients/          # External API clients
│   │   ├── spotify.ts
│   │   └── genius.ts
│   └── db/               # Database access
├── styles/               # Global styles and theme
└── tests/                # Test files
    ├── api/             # API route tests
    ├── services/        # Service tests
    ├── mocks/          # Mock implementations
    └── utils/          # Test utilities
```

## Testing Framework

### Test Setup
```typescript
// tests/setup.ts
import { setupTestDB } from './utils/db';
import { mockSpotify } from './mocks/spotify';
import { mockGenius } from './mocks/genius';

beforeAll(async () => {
  await setupTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  mockSpotify.reset();
  mockGenius.reset();
});
```

### Mock Utilities
```typescript
// tests/mocks/spotify.ts
export const mockSpotify = {
  tracks: new Map<string, SpotifyTrack>(),
  playlists: new Map<string, SpotifyPlaylist>(),

  addTrack(track: SpotifyTrack) {
    this.tracks.set(track.id, track);
  },

  addPlaylist(playlist: SpotifyPlaylist) {
    this.playlists.set(playlist.id, playlist);
  },

  reset() {
    this.tracks.clear();
    this.playlists.clear();
  }
};

// tests/mocks/genius.ts
export const mockGenius = {
  lyrics: new Map<string, string>(),

  setLyrics(trackId: string, lyrics: string) {
    this.lyrics.set(trackId, lyrics);
  },

  reset() {
    this.lyrics.clear();
  }
};
```

### Test Database Utilities
```typescript
// tests/utils/db.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

export async function setupTestDB() {
  // Use in-memory SQLite for tests
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db'
      }
    }
  });
  
  await db.$connect();
  return db;
}

export async function clearTestDB() {
  await db.game.deleteMany();
  await db.song.deleteMany();
}

// Scenario helpers
export async function createTestGame(params: CreateGameParams) {
  const song = await db.song.create({
    data: {
      spotifyId: params.spotifyId,
      title: params.title,
      artist: params.artist,
      lyrics: params.lyrics,
      maskedLyrics: params.maskedLyrics
    }
  });

  return await db.game.create({
    data: {
      date: params.date,
      songId: song.id
    },
    include: {
      song: true
    }
  });
}
```

### API Route Tests
```typescript
// tests/api/admin/games.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/admin/games/[date]/route';
import { mockSpotify, mockGenius } from '../../mocks';
import { createTestGame } from '../../utils/db';

describe('GET /api/admin/games/[date]', () => {
  it('returns 404 for non-existent game', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { date: '2024-01-16' }
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  it('returns game with song data', async () => {
    // Setup test data
    const game = await createTestGame({
      date: '2024-01-16',
      spotifyId: 'track123',
      title: 'Test Song',
      artist: 'Test Artist',
      lyrics: 'Test lyrics',
      maskedLyrics: {
        title: ['____', '____'],
        artist: ['____', '____'],
        lyrics: ['____', '____', '____']
      }
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: { date: '2024-01-16' }
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data).toMatchObject({
      id: game.id,
      date: game.date,
      song: {
        id: game.song.id,
        spotifyId: 'track123',
        title: 'Test Song',
        artist: 'Test Artist'
      }
    });
  });
});

describe('POST /api/admin/games/[date]', () => {
  beforeEach(() => {
    // Setup mock data
    mockSpotify.addTrack({
      id: 'track123',
      title: 'Test Song',
      artist: 'Test Artist',
      previewUrl: 'http://example.com/preview'
    });
    
    mockGenius.setLyrics('track123', 'Test lyrics');
  });

  it('creates new game with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { date: '2024-01-16' },
      body: {
        spotifyId: 'track123'
      }
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.song.spotifyId).toBe('track123');
    expect(data.song.maskedLyrics).toBeDefined();
  });

  it('handles Spotify API errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { date: '2024-01-16' },
      body: {
        spotifyId: 'invalid-id'
      }
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: 'SPOTIFY_ERROR'
    });
  });
});
```

### Service Tests
```typescript
// tests/services/song.test.ts
import { SongService } from '@/lib/services/song';
import { mockSpotify, mockGenius } from '../mocks';
import { prismaMock } from '../utils/db';

describe('SongService', () => {
  let songService: SongService;

  beforeEach(() => {
    songService = new SongService(prismaMock);
  });

  describe('getOrCreate', () => {
    it('returns existing song if found', async () => {
      const existingSong = {
        id: '1',
        spotifyId: 'track123',
        title: 'Test Song',
        artist: 'Test Artist'
      };

      prismaMock.song.findUnique.mockResolvedValue(existingSong);

      const result = await songService.getOrCreate('track123');
      expect(result).toEqual(existingSong);
    });

    it('creates new song if not found', async () => {
      prismaMock.song.findUnique.mockResolvedValue(null);
      
      mockSpotify.addTrack({
        id: 'track123',
        title: 'Test Song',
        artist: 'Test Artist'
      });
      
      mockGenius.setLyrics('track123', 'Test lyrics');

      const newSong = {
        id: '1',
        spotifyId: 'track123',
        title: 'Test Song',
        artist: 'Test Artist',
        lyrics: 'Test lyrics',
        maskedLyrics: expect.any(Object)
      };

      prismaMock.song.create.mockResolvedValue(newSong);

      const result = await songService.getOrCreate('track123');
      expect(result).toEqual(newSong);
    });
  });
});
```
``` 