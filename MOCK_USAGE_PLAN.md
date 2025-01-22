# Mock Usage Plan

## Current Implementation Review

### Spotify Mock
```typescript
// Current: Direct usage of spotifyData
export class SpotifyClientMock {
  tracks = {
    get: jest.fn().mockImplementation((id: string) => {
      const track = spotifyData.tracks[id];
      return Promise.resolve(track as Track);
    })
  };
  // ... other methods
}
```

### Genius Mock
```typescript
// Current: Direct usage of geniusData
export class GeniusClientMock {
  search = jest.fn().mockImplementation(() => {
    return Promise.resolve(geniusData.search);
  });
}
```

## Proposed Updates

### 1. Enhanced Mock Implementations

#### SpotifyClientMock
```typescript
import { spotifyData } from '@/lib/test/fixtures/spotify';
import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

export class SpotifyClientMock {
  tracks = {
    get: jest.fn().mockImplementation((id: string): Promise<Track> => {
      const track = spotifyData.tracks[id];
      if (!track) {
        return Promise.reject(new Error('Track not found'));
      }
      return Promise.resolve(track);
    })
  };

  search = {
    tracks: jest.fn().mockImplementation((query: string): Promise<Track[]> => {
      // Use search response from fixtures
      const searchResults = spotifyData.searches[query] || [];
      return Promise.resolve(searchResults);
    }),
    playlists: jest.fn()
  };

  playlists = {
    get: jest.fn(),
    getTracks: jest.fn()
  };
}
```

#### GeniusClientMock
```typescript
import { geniusData } from '@/lib/test/fixtures/genius';
import type { GeniusSearchResponse } from '@/types/genius';

export class GeniusClientMock {
  searchSong = jest.fn().mockImplementation(
    (title: string, artist: string): Promise<string | null> => {
      const key = `${title}-${artist}`.toLowerCase();
      const lyrics = geniusData.lyrics[key];
      return Promise.resolve(lyrics || null);
    }
  );
}
```

### 2. Test Environment Setup

```typescript
// src/lib/test/test-env/unit.ts
export interface UnitTestContext {
  mockPrisma: DeepMockProxy<PrismaClient>;
  mockSpotifyClient: SpotifyClientMock;
  mockGeniusClient: GeniusClientMock;
  mockGameService: ReturnType<typeof createGameService>;
  mockSongService: ReturnType<typeof createSongService>;
}

export function setupUnitTest(): UnitTestContext {
  const mockSpotifyClient = new SpotifyClientMock();
  const mockGeniusClient = new GeniusClientMock();
  
  // Setup services with mocks
  const mockSongService = createSongService(
    mockPrisma,
    mockSpotifyClient,
    mockGeniusClient
  );
  
  return {
    mockPrisma,
    mockSpotifyClient,
    mockGeniusClient,
    mockGameService,
    mockSongService
  };
}
```

### 3. Usage in Tests

```typescript
// Example: song.test.ts
describe('SongService', () => {
  let context: UnitTestContext;
  
  beforeEach(() => {
    context = setupUnitTest();
  });

  it('creates song with valid track', async () => {
    const { mockSpotifyClient, mockGeniusClient, mockSongService } = context;
    const trackId = SONG_KEYS.PARTY_IN_THE_U_S_A;
    
    // Test implementation using fixtures
    const result = await mockSongService.create(trackId);
    
    expect(mockSpotifyClient.tracks.get)
      .toHaveBeenCalledWith(trackId);
    expect(result.spotifyData)
      .toEqual(spotifyData.tracks[trackId]);
  });
});
```

## Implementation Steps

1. **Update Mock Implementations**
   - [ ] Update SpotifyClientMock with error handling
   - [ ] Update GeniusClientMock with proper search logic
   - [ ] Add TypeScript types for all responses

2. **Update Test Environment**
   - [ ] Add new mocks to UnitTestContext
   - [ ] Update setupUnitTest function
   - [ ] Update cleanupUnitTest function

3. **Update Test Files**
   - [ ] Update service tests to use new mocks
   - [ ] Update integration tests
   - [ ] Add new test cases for error scenarios

4. **Add Helper Functions**
   - [ ] Add functions to get test data by key
   - [ ] Add functions to create test scenarios
   - [ ] Add validation helpers

## Benefits
1. More realistic API simulation
2. Better error handling
3. Type-safe fixtures
4. Easier test maintenance
5. Consistent test data

## Notes
- Keep mock implementations simple
- Use fixtures for all test data
- Add proper error handling
- Maintain type safety 