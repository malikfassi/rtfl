# Test Fixtures Analysis

## Files Analyzed

### 1. genius.integration.test.ts

#### Key Patterns

1. **Context & Setup**
   - Uses centralized test context via `setupIntegrationTest()`
   - Clean separation of setup/teardown
   - Structured access to fixtures and constants

2. **Fixture Usage**
   - Hierarchical fixture organization (by service/endpoint)
   - Constants stored separately for test data IDs
   - Helper methods for fixture data transformation
   - Example: `context.fixtures.spotify.getTrack.get(id)`

3. **Validation**
   - Dedicated validators per client/service
   - Detailed error reporting with context
   - Comprehensive response validation

4. **Error Handling**
   - Coverage of success and error paths
   - Predefined constants for error scenarios
   - Specific error type assertions

#### Notable Examples
```typescript
// Fixture access pattern
const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
const track = context.fixtures.spotify.getTrack.get(id);

// Validation pattern with debug info
try {
  integration_validator.genius_client.search(results, query);
} catch (error) {
  console.log('Search validation failed. Debug info:');
  console.log('Query:', query);
  console.log('Results:', JSON.stringify(results, null, 2));
  throw error;
}
```

### 2. genius.unit.test.ts

#### Key Patterns

1. **Mocking Setup**
   - Uses dedicated mock factory: `GeniusMocks.createClient()`
   - Injects mocked client through constructor
   - Clear separation between real and mocked implementations

2. **Fixture Usage**
   - Reuses same fixture patterns as integration tests
   - Consistent use of `context.fixtures` and `context.constants`
   - Shared test data between unit and integration tests

3. **Validation**
   - Simpler validation through `context.validator`
   - Mock call verification using `expect().toHaveBeenCalledWith()`
   - No debug info needed (simpler mock validation)

4. **Error Testing**
   - Uses `mockRejectedValueOnce` for error scenarios
   - Consistent error types between unit and integration
   - Verifies both error throwing and mock calls

#### Notable Examples
```typescript
// Mock setup pattern
mockGeniusClient = GeniusMocks.createClient();
client = new GeniusClientImpl('test-access-token', mockGeniusClient);

// Error testing pattern
mockGeniusClient.search.mockRejectedValueOnce(new GeniusApiError(new Error('No results')));
await expect(client.search(query)).rejects.toThrow(GeniusApiError);
expect(mockGeniusClient.search).toHaveBeenCalledWith(query);
```

### 3. spotify.unit.test.ts

#### Key Patterns

1. **Test Organization**
   - Consistent use of `setupUnitTest()` for context initialization
   - Clear separation of setup/cleanup in `beforeEach`/`afterEach`
   - Mock injection through constructor dependency injection
   - Use of dedicated mock factories (`SpotifyMocks.createClient()`)

2. **Test Structure**
   - Tests grouped by method/functionality
   - Each group covers both success and error paths
   - Specific error type testing (e.g., `TrackNotFoundError`, `SpotifyApiError`)
   - Consistent arrange-act-assert pattern in test cases

3. **Fixture Usage**
   - Structured access via context: `context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA`
   - Helper methods for fixture access: `fixtures.spotify.getTrack.get(id)`
   - Centralized test data IDs in constants
   - Shared fixtures between unit and integration tests

4. **Validation**
   - Service-specific validators: `context.validator.spotify_client`
   - Comprehensive validation of structure and content
   - Mock call verification with `expect().toHaveBeenCalledWith()`
   - Error validation includes type checking and mock call verification

#### Notable Examples
```typescript
// Test setup pattern
beforeEach(() => {
  context = setupUnitTest();
  mockSpotifyClient = SpotifyMocks.createClient();
  client = new SpotifyClientImpl('test-client-id', 'test-client-secret', mockSpotifyClient);
});

// Success path testing
it('should return track for valid id', async () => {
  const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
  const track = await client.getTrack(id);
  context.validator.spotify_client.track(track, id);
  expect(mockSpotifyClient.getTrack).toHaveBeenCalledWith(id);
});

// Error path testing
it('should throw TrackNotFoundError for non-existent track', async () => {
  mockSpotifyClient.getTrack.mockRejectedValueOnce(new TrackNotFoundError());
  await expect(client.getTrack('non-existent')).rejects.toThrow(TrackNotFoundError);
  expect(mockSpotifyClient.getTrack).toHaveBeenCalledWith('non-existent');
});
```

### 4. spotify.integration.test.ts

#### Key Patterns

1. **Test Setup & Organization**
   - Uses `setupIntegrationTest()` and `cleanupIntegrationTest()` for consistent environment
   - Clear separation of concerns with `beforeEach`/`afterEach` hooks
   - Tests grouped logically by API endpoint/functionality
   - Comprehensive constructor validation

2. **Error Handling & Debug Support**
   - Extensive error debugging information
   - Detailed console logging for validation failures
   - Example debug pattern:
   ```typescript
   try {
     integration_validator.spotify_client.track(track, id);
   } catch (error) {
     console.log('Track validation failed. Debug info:');
     console.log('Track ID:', id);
     console.log('Track:', JSON.stringify(track, null, 2));
     console.log('Error:', error);
     throw error;
   }
   ```

3. **Validation Strategy**
   - Uses dedicated `integration_validator.spotify_client` for response validation
   - Validates both success and error paths for each endpoint
   - Comprehensive validation of response structures
   - Specific error type assertions (e.g., `TrackNotFoundError`, `PlaylistNotFoundError`)

4. **Fixture & Test Data Management**
   - Structured access to test data via context: `context.constants.ids.SPOTIFY.TRACKS`
   - Reuses fixture data for search queries
   - Consistent pattern for accessing reference data:
   ```typescript
   const trackId = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
   const track = context.fixtures.spotify.getTrack.get(trackId);
   ```

5. **Search Testing**
   - Tests both track and playlist search functionality
   - Uses utility functions for query construction (`constructSpotifySearchQuery`)
   - Validates search results against reference data
   - Includes edge cases like empty queries

6. **API Integration Patterns**
   - Real API calls with actual credentials from environment
   - Comprehensive coverage of main Spotify API endpoints
   - Tests for both successful and failed API responses
   - Proper error handling for API-specific errors

#### Notable Examples
```typescript
// Search validation with debug info
const tracks = await client.searchTracks(query);
try {
  integration_validator.spotify_client.search(tracks, query);
} catch (error) {
  console.log('Search validation failed. Debug info:');
  console.log('Query:', query);
  console.log('Search Terms:', query.toLowerCase().split(' '));
  console.log('First Result:', {
    name: tracks[0].name,
    artists: tracks[0].artists.map(a => a.name)
  });
  throw error;
}

// Error path testing
it('should throw PlaylistNotFoundError for non-existent playlist', async () => {
  await expect(client.getPlaylistTracks('non-existent'))
    .rejects.toThrow(PlaylistNotFoundError);
});
```

### 5. test/env/unit.ts

#### Key Patterns

1. **Test Context Interface Design**
   - Clear separation of external clients and test utilities
   - Strong TypeScript interfaces for all mock clients:
   ```typescript
   export interface UnitTestContext {
     // External clients
     mockSpotifyClient: jest.Mocked<SpotifyClient>;
     mockGeniusClient: jest.Mocked<GeniusClient>;
     // Test utilities
     validator: typeof unit_validator;
     fixtures: typeof fixtures;
     constants: {
       ids: typeof TEST_IDS;
       dates: typeof TEST_DATES;
       players: typeof TEST_PLAYERS;
     };
   }
   ```

2. **Mock Client Definitions**
   - Explicit interface definitions for external services
   - Type-safe mock creation using jest.Mocked
   - Comprehensive API surface coverage:
   ```typescript
   export interface SpotifyClient {
     getTrack(id: string): Promise<Track>;
     searchTracks(query: string): Promise<Track[]>;
     getPlaylistTracks(id: string): Promise<Track[]>;
   }
   ```

3. **Test Utility Organization**
   - Centralized access to validators, fixtures, and constants
   - Consistent structure across different test types
   - Reusable test data through shared constants
   - Type-safe access to all test utilities

4. **Setup and Cleanup Patterns**
   - Factory function pattern for context creation (`setupUnitTest()`)
   - Automatic mock creation and initialization
   - Clean mock reset through `cleanupUnitTest()`
   - Consistent cleanup pattern using `jest.resetAllMocks()`

5. **Type Safety**
   - Full TypeScript integration for mocks and utilities
   - Imported types from external packages (e.g., `@spotify/web-api-ts-sdk`)
   - Type-safe constants and fixtures
   - Strong typing for all test context properties

#### Notable Examples
```typescript
// Context setup with typed mocks
const mockSpotifyClient: jest.Mocked<SpotifyClient> = {
  getTrack: jest.fn(),
  searchTracks: jest.fn(),
  getPlaylistTracks: jest.fn()
};

// Type-safe test context usage
const context = setupUnitTest();
context.mockSpotifyClient.getTrack.mockResolvedValue(
  context.fixtures.spotify.getTrack.get(
    context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA
  )
);
```

### 6. test/env/integration.ts

#### Key Patterns

1. **Database Integration**
   - Direct Prisma client integration for database access
   - Structured database cleanup with transaction support:
   ```typescript
   export async function cleanDatabase() {
     await prisma.$transaction(async (tx) => {
       await tx.$executeRaw`PRAGMA foreign_keys = OFF;`;
       await tx.guess.deleteMany();
       await tx.game.deleteMany();
       await tx.song.deleteMany();
       await tx.$executeRaw`PRAGMA foreign_keys = ON;`;
     });
   }
   ```

2. **Service Layer Integration**
   - Real service instances with actual dependencies
   - Complete service hierarchy setup:
   ```typescript
   const songService = new SongService(prisma, spotifyClient, geniusService);
   const gameService = new GameService(songService, prisma);
   const guessService = new GuessService(prisma);
   ```

3. **Environment Configuration**
   - Environment variable loading via dotenv
   - Real external client initialization with environment credentials
   - Type-safe environment variable usage:
   ```typescript
   const spotifyClient = new SpotifyClientImpl(
     process.env.SPOTIFY_CLIENT_ID!,
     process.env.SPOTIFY_CLIENT_SECRET!
   );
   ```

4. **Test Context Management**
   - Comprehensive context interface with all dependencies
   - Structured cleanup handling
   - Shared test utilities across integration tests:
   ```typescript
   export interface IntegrationTestContext {
     prisma: PrismaClient;
     songService: SongService;
     gameService: GameService;
     guessService: GuessService;
     validator: typeof integration_validator;
     fixtures: typeof fixtures;
     constants: {
       ids: typeof TEST_IDS;
       dates: typeof TEST_DATES;
       players: typeof TEST_PLAYERS;
     };
     cleanup: () => Promise<void>;
   }
   ```

5. **Error Handling**
   - Graceful cleanup error handling
   - Detailed error logging during cleanup
   - Transaction-based database operations for atomicity
   - Foreign key constraint management

6. **Setup and Teardown Flow**
   - Clear setup sequence:
     1. Database cleanup
     2. External client initialization
     3. Service creation
     4. Context assembly
   - Consistent teardown through cleanup function
   - Error-safe cleanup operations

#### Notable Examples
```typescript
// Service initialization with real dependencies
const spotifyClient = new SpotifyClientImpl(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!
);
const songService = new SongService(prisma, spotifyClient, geniusService);

// Safe database cleanup with error handling
export async function cleanupIntegrationTest() {
  try {
    await cleanDatabase();
  } catch (error) {
    console.error('Error during test cleanup:', error);
    throw error;
  }
}
```

### 7. Fixture Generation and Access Patterns

#### Generator (generator.ts)

1. **Generated Data Types**
   - Spotify Track Data
     - Individual track details
     - Track search results
     - Track-based Genius search results
     - Associated lyrics
   - Spotify Playlist Data
     - Playlist details with tracks
     - Playlist search results
   - Genius Data
     - Search results for tracks
     - Search results for special queries
     - Lyrics for tracks and special URLs

2. **Generation Flow**
   ```typescript
   // Main generation sequence
   async function generateFixtures() {
     // 1. Generate track-related fixtures
     for (const [key, id] of tracks) {
       await captureFixtureForTrack(spotifyApi, id);
       // Generates: track data, search results, Genius search, lyrics
     }
     
     // 2. Generate playlist-related fixtures
     for (const [key, id] of playlists) {
       // Generates: playlist data, playlist search results
     }
     
     // 3. Generate special Genius fixtures
     await captureGeniusFixtures();
     // Generates: special search queries, special lyrics URLs
   }
   ```

3. **File Organization**
   - Hierarchical structure by service and type:
   ```
   data/
     spotify/
       tracks/[id].json
       search/[id].json
       playlists/[id].json
     genius/
       search/[id].json
       lyrics/[id].html
   ```

#### Access Layer (index.ts)

1. **Data Access Interfaces**
   ```typescript
   export interface SpotifyFixtures {
     tracks: { [key: string]: Track };
     search: { 
       [key: string]: { 
         tracks?: { items: Track[] },
         playlists?: { items: SimplifiedPlaylist[] }
       } 
     };
     playlists: { [key: string]: { name: string; tracks: { items: { track: Track }[] } } };
   }

   export interface GeniusFixtures {
     search: { [key: string]: GeniusSearchResponse };
     lyrics: { [key: string]: string };
   }
   ```

2. **Access Patterns**
   - Direct Track Access:
   ```typescript
   fixtures.spotify.getTrack.get(id)  // By Spotify URI
   ```
   - Search Results Access:
   ```typescript
   // Note: Queries are constructed differently for access vs storage
   fixtures.spotify.searchTracks.get(query)  // By constructed query string
   fixtures.spotify.searchPlaylists.get(query)  // By playlist name
   ```
   - Genius Data Access:
   ```typescript
   fixtures.genius.search.get(query)  // By constructed query
   fixtures.genius.lyrics.get(url)    // By Genius URL
   ```

3. **Key Indexing Differences**
   - Spotify Tracks:
     - Generated: By track ID
     - Accessed: By full Spotify URI
   - Search Results:
     - Generated: By ID or playlist ID
     - Accessed: By constructed search query
   - Genius Data:
     - Generated: By track ID or special key
     - Accessed: By constructed query or URL

4. **Helper Functions**
   ```typescript
   // Query Construction
   constructSpotifySearchQuery(track.name, track.artists[0].name)
   constructGeniusSearchQuery(track.name, track.artists[0].name)

   // Fixture Access with Error Handling
   const getFixture = <T>(obj: Record<string, T>, key: string, type: string): T => {
     // Case-insensitive search for search fixtures
     if (type === 'search') {
       const lowerKey = key.toLowerCase();
       const match = Object.entries(obj).find(([k]) => k.toLowerCase() === lowerKey);
       if (match) return match[1];
     }
     // Direct access for other types
     const response = obj[key];
     if (!response) throw new Error(`No fixture found for ${type}: ${key}`);
     return response;
   }
   ```

#### Notable Examples

1. **Generating Track Fixtures**
```typescript
// In generator.ts
async function captureFixtureForTrack(spotifyApi: SpotifyApi, id: string) {
  const track = await captureSpotifyTrack(spotifyApi, id);
  await captureSpotifySearch(spotifyApi, track);
  const query = getGeniusQuery(track);
  const geniusData = await captureGeniusSearch(query, getId(id));
  await captureGeniusLyrics(geniusData.response.hits[0].result.url, getId(id));
}
```

2. **Accessing Track Fixtures**
```typescript
// In test files
const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
const track = context.fixtures.spotify.getTrack.get(id);
const searchResults = context.fixtures.spotify.searchTracks.get(
  constructSpotifySearchQuery(track.name, track.artists[0].name)
);
```

### 8. Mock Implementation Patterns

#### Key Patterns

1. **Factory Class Pattern**
   - Static factory methods for client creation
   - Consistent class naming: `[Service]Mocks`
   - Type-safe mock creation:
   ```typescript
   export class SpotifyMocks {
     static createClient(): jest.Mocked<SpotifyClient> {
       return {
         getTrack: jest.fn().mockImplementation((id: string) => {
           return Promise.resolve(fixtures.spotify.getTrack.get(id));
         }),
         // ... other methods
       } as jest.Mocked<SpotifyClient>;
     }
   }
   ```

2. **Fixture Integration**
   - Direct fixture access in mock implementations
   - Consistent access patterns matching real clients
   - Automatic fixture resolution:
   ```typescript
   searchTracks: jest.fn().mockImplementation((query: string) => {
     return Promise.resolve(fixtures.spotify.searchTracks.get(query));
   })
   ```

3. **Type Safety**
   - Strong typing with jest.Mocked<T>
   - Interface-based mock creation
   - Type consistency with real clients:
   ```typescript
   import { SpotifyClient } from '@/app/api/lib/clients/spotify';
   import type { Track, Page, Playlist } from '@spotify/web-api-ts-sdk';
   ```

4. **Centralized Mock Creation**
   - Helper function for creating all mocks:
   ```typescript
   export function createMocks() {
     return {
       spotifyClient: SpotifyMocks.createClient(),
       geniusClient: GeniusMocks.createClient()
     };
   }
   ```

5. **Promise-based API Simulation**
   - All mock methods return Promises
   - Consistent with real async API behavior
   - Error simulation support through jest methods

#### Mock Implementation Examples

1. **Spotify Client Mock**
```typescript
// Mock with fixture integration
getTrack: jest.fn().mockImplementation((id: string) => {
  return Promise.resolve(fixtures.spotify.getTrack.get(id));
}),
searchTracks: jest.fn().mockImplementation((query: string) => {
  return Promise.resolve(fixtures.spotify.searchTracks.get(query));
})
```

2. **Genius Client Mock**
```typescript
// Mock with comments and error handling
search: jest.fn().mockImplementation((query: string) => {
  // The validator expects the raw fixture data for the given ID
  return Promise.resolve(fixtures.genius.search.get(query));
}),
fetchLyricsPage: jest.fn().mockImplementation((url: string) => {
  return Promise.resolve(fixtures.genius.lyrics.get(url));
})
```

#### Usage Patterns

1. **Individual Mock Creation**
```typescript
const mockSpotifyClient = SpotifyMocks.createClient();
const client = new SpotifyClientImpl('id', 'secret', mockSpotifyClient);
```

2. **Bulk Mock Creation**
```typescript
const mocks = createMocks();
const spotifyClient = new SpotifyClientImpl('id', 'secret', mocks.spotifyClient);
const geniusClient = new GeniusClientImpl('token', mocks.geniusClient);
```

3. **Error Simulation**
```typescript
mockSpotifyClient.getTrack
  .mockRejectedValueOnce(new TrackNotFoundError());
```

#### Key Benefits

1. **Consistency**
   - Mocks use same fixtures as integration tests
   - Consistent behavior across test types
   - Type-safe implementations

2. **Maintainability**
   - Centralized mock creation
   - Easy to extend with new methods
   - Clear separation of concerns

3. **Type Safety**
   - Full TypeScript integration
   - Interface-based implementations
   - Compile-time error detection

### 9. Integration Validators

#### Key Patterns

1. **Layered Validation**
   - Builds on unit validators as foundation
   - Adds integration-specific checks
   - Type casting with runtime validation:
   ```typescript
   export const spotify_client = {
     track: (track: unknown, id: string) => {
       // First run unit validations
       unit_validator.spotify_client.track(track, id);
       // Then add integration-specific checks
       const t = track as Track;
       const fixture = fixtures.spotify.getTrack.get(id);
       expect(t.id).toBe(id.replace('spotify:track:', ''));
       expect(t.name).toBe(fixture.name);
     }
   };
   ```

2. **Structural Validation**
   - Deep object structure verification
   - Array content validation
   - Type-specific checks:
   ```typescript
   results.forEach(track => {
     // Validate track structure
     expect(track.id).toBeDefined();
     expect(track.name).toBeDefined();
     expect(track.uri.startsWith('spotify:track:')).toBe(true);
     // Validate nested structures
     expect(track.artists).toBeDefined();
     expect(Array.isArray(track.artists)).toBe(true);
   });
   ```

3. **Fixture Comparison**
   - Direct comparison with fixture data
   - Length and content validation
   - Index-based matching:
   ```typescript
   playlist_tracks: (tracks: unknown, id: string) => {
     const results = tracks as Track[];
     const fixture = fixtures.spotify.getPlaylist.get(id);
     expect(results.length).toBe(fixture.tracks.items.length);
     results.forEach((track, index) => {
       expect(track).toEqual(fixture.tracks.items[index].track);
     });
   }
   ```

4. **API-Specific Validation**
   - Response format validation
   - Status code checking
   - Service-specific patterns:
   ```typescript
   // Genius API validation
   expect(r.meta.status).toBe(200);
   expect(Array.isArray(r.response.hits)).toBe(true);
   // Spotify URI validation
   expect(track.uri.startsWith('spotify:track:')).toBe(true);
   ```

5. **Content Type Validation**
   - HTML content verification for lyrics
   - JSON structure validation for API responses
   - Type-specific checks:
   ```typescript
   lyrics: (lyrics: unknown, url: string) => {
     const l = lyrics as string;
     expect(typeof l).toBe('string');
     expect(l.length).toBeGreaterThan(0);
     expect(l.toLowerCase().includes('<!doctype html>')).toBe(true);
   }
   ```

#### Notable Examples

1. **Spotify Track Validation**
```typescript
track: (track: unknown, id: string) => {
  // Base validation
  unit_validator.spotify_client.track(track, id);
  const t = track as Track;
  const fixture = fixtures.spotify.getTrack.get(id);
  // Integration checks
  expect(t.id).toBe(id.replace('spotify:track:', ''));
  expect(t.name).toBe(fixture.name);
  expect(t.artists[0].name).toBe(fixture.artists[0].name);
}
```

2. **Genius Search Validation**
```typescript
search: (response: unknown, query: string) => {
  const r = response as GeniusSearchResponse;
  unit_validator.genius_client.search(r, query);
  // Integration checks
  expect(r.meta.status).toBe(200);
  r.response.hits.forEach((hit: GeniusHit) => {
    expect(hit.result.title).toBeDefined();
    expect(hit.result.url).toBeDefined();
    expect(hit.result.primary_artist.name).toBeDefined();
  });
}
```

#### Key Benefits

1. **Comprehensive Validation**
   - Multiple layers of validation
   - Deep structure verification
   - Content-specific checks

2. **Type Safety**
   - Runtime type checking
   - TypeScript integration
   - Explicit type casting

3. **Reusability**
   - Builds on unit validators
   - Consistent validation patterns
   - Shared validation logic

### 10. Unit Validators

#### Key Patterns

1. **Base Validation Structure**
   - Type-safe parameter handling
   - Fixture-based validation
   - Comprehensive structure checking:
   ```typescript
   export const spotify_client = {
     track: (track: unknown, id: string) => {
       expect(track).toBeDefined();
       const t = track as Track;
       const fixture = fixtures.spotify.getTrack.get(id);
       // Structure validation
       expect(t.id).toBeDefined();
       expect(t.name).toBeDefined();
       // Fixture comparison
       expect(t).toEqual(fixture);
     }
   };
   ```

2. **Hierarchical Validation**
   - Progressive validation levels
   - Structure before content
   - Nested object validation:
   ```typescript
   // Validate track structure
   expect(t.id).toBeDefined();
   expect(t.name).toBeDefined();
   expect(Array.isArray(t.artists)).toBe(true);
   expect(t.artists.length).toBeGreaterThan(0);
   expect(t.artists[0].name).toBeDefined();
   ```

3. **Conditional Validation**
   - Query-dependent validation rules
   - Reference data comparison
   - Flexible matching:
   ```typescript
   // Only validate against fixture if query matches reference
   if (query === expectedQuery) {
     const fixtureResults = fixtures.spotify.searchTracks.get(query);
     expect(results).toEqual(fixtureResults);
   }
   ```

4. **Content Type Validation**
   - HTML structure validation
   - JSON response validation
   - Type-specific checks:
   ```typescript
   // HTML content validation
   expect(lyrics.toLowerCase().includes('<!doctype html>')).toBe(true);
   expect(lyrics.includes('</head>')).toBe(true);
   expect(lyrics.includes('<body')).toBe(true);
   
   // JSON structure validation
   expect(response.meta).toBeDefined();
   expect(response.meta.status).toBe(200);
   ```

5. **Array Content Validation**
   - Null filtering
   - Item-by-item validation
   - Collection integrity checks:
   ```typescript
   const validPlaylists = result.playlists.items.filter(playlist => playlist !== null);
   validPlaylists.forEach(playlist => {
     expect(playlist.id).toBeDefined();
     expect(playlist.name).toBeDefined();
     expect(playlist.type).toBe('playlist');
   });
   ```

#### Notable Examples

1. **Spotify Track Search Validation**
```typescript
search: (tracks: unknown, query: string) => {
  expect(Array.isArray(tracks)).toBe(true);
  const results = tracks as Track[];
  
  // Get reference data
  const referenceTrack = fixtures.spotify.getTrack.get(TEST_IDS.SPOTIFY.TRACKS.PARTY_IN_THE_USA);
  const expectedQuery = constructSpotifySearchQuery(referenceTrack.name, referenceTrack.artists[0].name);
  
  // Conditional validation
  if (query === expectedQuery) {
    const fixtureResults = fixtures.spotify.searchTracks.get(query);
    expect(results).toEqual(fixtureResults);
  }
}
```

2. **Genius Lyrics Validation**
```typescript
lyrics: (lyrics: string, url: string) => {
  expect(typeof lyrics === 'string').toBe(true);
  const fixture = fixtures.genius.lyrics.get(url);
  
  // HTML structure validation
  expect(lyrics.toLowerCase().includes('<!doctype html>')).toBe(true);
  expect(lyrics.includes('</head>')).toBe(true);
  
  // Content validation
  expect(lyrics.includes('genius.com')).toBe(true);
  expect(lyrics.length).toBeGreaterThan(1000);
}
```

#### Key Differences from Integration Validators

1. **Validation Focus**
   - Unit: Structure and type correctness
   - Integration: Real API behavior and data consistency

2. **Fixture Usage**
   - Unit: Direct fixture comparison
   - Integration: Fixture-based expectations with real data

3. **Error Handling**
   - Unit: Basic type and structure validation
   - Integration: Comprehensive error cases and edge conditions

4. **Validation Depth**
   - Unit: Core data structure validation
   - Integration: Deep validation with business rules

## Initial Guidelines (Draft)

1. **Test Organization**
   - Use centralized test context setup (`setupUnitTest()`, `setupIntegrationTest()`)
   - Implement clear setup/cleanup patterns
   - Use dependency injection for mocks
   - Create dedicated mock factories per service
   - Keep test files focused and organized by functionality

2. **Fixture Management**
   - Organize fixtures hierarchically by service and endpoint
   - Use centralized constants for test data IDs
   - Implement helper methods for fixture access
   - Share fixtures between unit and integration tests
   - Keep fixtures minimal and focused

3. **Test Structure**
   - Group tests by method/functionality
   - Include both success and error paths
   - Follow arrange-act-assert pattern
   - Test specific error types and scenarios
   - Verify mock calls when using mocks

4. **Validation Strategy**
   - Create service-specific validators
   - Validate both structure and content
   - Include mock call verification in unit tests
   - Add debug information for integration tests
   - Keep validations focused and reusable

5. **Error Testing**
   - Test specific error types
   - Verify error messages and details
   - Check both error throwing and function calls
   - Mock error scenarios appropriately
   - Include edge cases and error conditions

6. **Mock Strategy**
   - Use dedicated mock factories
   - Inject mocks through constructor/dependency injection
   - Keep mock implementations simple
   - Verify mock calls in assertions
   - Maintain consistent error types between unit and integration tests

*Note: This is an ongoing analysis. More patterns and guidelines will be added as we analyze additional test files.* 