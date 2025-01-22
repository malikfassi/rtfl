# Implementation Steps

## Phase 1: Clean & Setup
- [ ] Clean up fixtures directory:
  ```bash
  rm -rf src/lib/test/fixtures/*
  ```
- [ ] Create base files:
  ```
  src/lib/test/
  ├── fixtures/
  │   ├── spotify.ts    # Will be generated
  │   ├── genius.ts     # Will be generated
  │   └── index.ts      # Re-exports
  ├── mocks/
  │   ├── spotify.ts    # Mock implementation
  │   └── genius.ts     # Mock implementation
  ```

## Phase 2: Generator Implementation
- [ ] Create `scripts/generate-fixtures.ts`:
  ```typescript
  const SONGS = [
    {
      spotifyId: '5Q0Nhxo0l2bP3pNjpGJwV1', // Party in the USA
      artist: 'Miley Cyrus'
    },
    {
      spotifyId: '6gBFPUFcJLzWGx4lenP6h2', // Baby One More Time
      artist: 'Britney Spears'
    }
  ];

  // Fetch and save data
  async function main() {
    // Implementation from SIMPLE_GENERATOR.md
  }
  ```
- [ ] Add script to package.json:
  ```json
  {
    "scripts": {
      "generate-fixtures": "ts-node scripts/generate-fixtures.ts"
    }
  }
  ```
- [ ] Run generator to create initial fixtures

## Phase 3: Mock Implementation
- [ ] Keep current mock implementations with minor improvements:
  
  **Spotify Mock** (existing implementation):
  ```typescript
  // src/lib/test/mocks/spotify.ts - Already good, just add error handling
  export class SpotifyClientMock {
    tracks = {
      get: jest.fn().mockImplementation((id: string): Promise<Track> => {
        const track = spotifyData.tracks[id as keyof typeof spotifyData.tracks];
        if (!track) {
          return Promise.reject(new Error('Track not found'));
        }
        return Promise.resolve(track as unknown as Track);
      })
    };

    search = {
      tracks: jest.fn().mockImplementation((query: string) => {
        const searchResults = spotifyData.searches[query] || [];
        return Promise.resolve(searchResults);
      })
    };
  }
  ```

  **Genius Mock** (existing implementation):
  ```typescript
  // src/lib/test/mocks/genius.ts - Already good, just add error case
  export class GeniusClientMock {
    search = jest.fn().mockImplementation((_query: string): Promise<GeniusSearchResponse> => {
      if (!geniusData.search) {
        return Promise.reject(new Error('No search results'));
      }
      return Promise.resolve(geniusData.search);
    });
  }
  ```

  Changes needed:
  - [ ] Add error handling to Spotify mock's track.get
  - [ ] Add error handling to Genius mock's search
  - [ ] Add proper typing for search results in Spotify mock
  - [ ] Verify all type assertions are correct

## Phase 4: Test Environment Updates
- [ ] Update test context:
  ```typescript
  // src/lib/test/test-env/unit.ts
  export interface UnitTestContext {
    mockSpotifyClient: SpotifyClientMock;
    mockGeniusClient: GeniusClientMock;
    // ... other mocks
  }
  ```

## Phase 5: Update Tests
- [ ] Service Tests:
  - [ ] `src/lib/services/__tests__/song.test.ts`
  - [ ] `src/lib/services/__tests__/game.test.ts`
  - [ ] `src/lib/services/__tests__/guess.test.ts`

- [ ] Integration Tests:
  - [ ] `src/lib/services/__tests__/song.integration.test.ts`
  - [ ] `src/lib/services/__tests__/game.integration.test.ts`
  - [ ] `src/lib/services/__tests__/guess.integration.test.ts`

- [ ] API Tests:
  - [ ] `src/app/api/admin/spotify/tracks/[id]/__tests__/route.test.ts`
  - [ ] `src/app/api/admin/spotify/tracks/search/__tests__/route.test.ts`
  - [ ] `src/app/api/admin/spotify/playlists/[id]/tracks/__tests__/route.test.ts`

Example test update:
```typescript
// Before
it('creates song with valid track', async () => {
  mockSpotifyClient.getTrack.mockResolvedValue({...});
  mockGeniusClient.searchSong.mockResolvedValue('lyrics');
});

// After
it('creates song with valid track', async () => {
  const trackId = '5Q0Nhxo0l2bP3pNjpGJwV1'; // Party in the USA
  const result = await songService.create(trackId);
  
  expect(mockSpotifyClient.tracks.get)
    .toHaveBeenCalledWith(trackId);
  expect(result.spotifyData)
    .toEqual(spotifyData.tracks[trackId]);
});
```

## Phase 6: Verification
- [ ] Run generator:
  ```bash
  pnpm generate-fixtures
  ```
- [ ] Run all tests:
  ```bash
  pnpm test
  ```
- [ ] Verify fixtures are used consistently
- [ ] Check error scenarios work correctly

## Progress Tracking

### Current Status
- [x] Phase 1: Clean & Setup
  - [x] Clean up fixtures directory
  - [x] Create base files
- [x] Phase 2: Generator Implementation
  - [x] Create generate-fixtures.ts
  - [x] Add script to package.json
  - [x] Generate initial fixtures
- [ ] Phase 3: Mock Implementation
  - [x] Basic mock structure in place
  - [ ] Add error handling to Spotify mock
  - [ ] Add error handling to Genius mock
  - [ ] Verify type assertions
- [ ] Phase 4: Test Environment Updates
- [ ] Phase 5: Update Tests
- [ ] Phase 6: Verification

### Next Steps
1. Complete Phase 3: Mock Implementation
   - Update error handling in both mocks
   - Verify type assertions
2. Move on to Test Environment Updates
3. Update tests incrementally
4. Final verification

### Notes
- Generator script is working well
- Fixtures are being generated correctly
- Need to focus on improving mock implementations
- Will need to update tests to use new fixtures consistently

## Progress Tracking

### Current Status
- [x] Phase 1: Clean & Setup
  - [x] Clean up fixtures directory
  - [x] Create base files
- [x] Phase 2: Generator Implementation
  - [x] Create generate-fixtures.ts
  - [x] Add script to package.json
  - [x] Generate initial fixtures
- [ ] Phase 3: Mock Implementation
  - [x] Basic mock structure in place
  - [ ] Add error handling to Spotify mock
  - [ ] Add error handling to Genius mock
  - [ ] Verify type assertions
- [ ] Phase 4: Test Environment Updates
- [ ] Phase 5: Update Tests
- [ ] Phase 6: Verification

### Next Steps
1. Complete Phase 3: Mock Implementation
   - Update error handling in both mocks
   - Verify type assertions
2. Move on to Test Environment Updates
3. Update tests incrementally
4. Final verification

### Notes
- Generator script is working well
- Fixtures are being generated correctly
- Need to focus on improving mock implementations
- Will need to update tests to use new fixtures consistently 