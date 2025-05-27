# Fixture Refactoring Guidelines

## Current State
- Fixtures are generated via `generator.ts` and stored as JSON/HTML files in `src/app/api/lib/test/fixtures/data/`
- Fixtures are loaded through helper functions in `index.ts` (`loadJsonFixture`, `loadHtmlFixture`)
- Tests use separate validators for unit and integration tests
- Test setup uses `setupUnitTest()` and `setupIntegrationTest()`
- Mocks are created through service-specific mock factories (e.g., `SpotifyMocks.createClient()`)

## Core Use Cases

### 1. Test Setup
```typescript
// Integration Tests
describe('SpotifyClient', () => {
  let client: SpotifyClientImpl;
  let context: IntegrationTestContext;

  beforeEach(async () => {
    context = await setupIntegrationTest();
    client = new SpotifyClientImpl(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
  });
});

// Unit Tests
describe('SpotifyClient', () => {
  let client: SpotifyClientImpl;
  let context: UnitTestContext;
  let mockSpotifyClient: jest.Mocked<SpotifyClient>;

  beforeEach(() => {
    context = setupUnitTest();
    mockSpotifyClient = SpotifyMocks.createClient();
    client = new SpotifyClientImpl('test-client-id', 'test-client-secret', mockSpotifyClient);
  });
});
```

### 2. Fixture Loading
```typescript
// Current implementation
interface SpotifyFixtures {
  tracks: { [key: string]: Track };
  search: { 
    [key: string]: { 
      tracks?: { items: Track[] },
      playlists?: { items: SimplifiedPlaylist[] }
    } 
  };
  playlists: { [key: string]: { name: string; tracks: { items: { track: Track }[] } } };
}

// Loading fixtures
const fixture = loadJsonFixture<Track>('spotify', 'tracks', id);
const htmlFixture = loadHtmlFixture('genius', 'lyrics', id);
```

### 3. Validation
```typescript
// Integration validator
export const spotify_client = {
  track: (track: unknown, id: string) => {
    // First run unit validations
    unit_validator.spotify_client.track(track, id);
    const t = track as Track;
    const fixture = fixtures.spotify.getTrack.get(id);
    // Additional integration checks
    expect(t.id).toBe(id.replace('spotify:track:', ''));
    expect(t.name).toBe(fixture.name);
    expect(t.artists[0].name).toBe(fixture.artists[0].name);
  }
};

// Usage in tests
it('should return track for valid id', async () => {
  const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
  const track = await client.getTrack(id);
  integration_validator.spotify_client.track(track, id);
});
```

### 4. Fixture Generation
```typescript
// Using generator.ts
async function captureFixtureForTrack(spotifyApi: SpotifyApi, id: string): Promise<void> {
  const track = await captureSpotifyTrack(spotifyApi, id);
  await captureSpotifySearch(spotifyApi, track);
  const query = getGeniusQuery(track);
  const geniusData = await captureGeniusSearch(query, getId(id));
  if (geniusData?.response?.hits?.[0]?.result?.url) {
    await captureGeniusLyrics(geniusData.response.hits[0].result.url, getId(id));
  }
}
```

## Implementation Steps

### Phase 1: Fixture Organization
1. Maintain current directory structure:
```
fixtures/
  data/
    spotify/
      tracks/
      search/
      playlists/
    genius/
      search/
      lyrics/
```

### Phase 2: Type Safety
1. Define strict interfaces for all fixtures
2. Add type guards for validation
3. Ensure all fixture access is typed

### Phase 3: Validation Enhancement
1. Consolidate common validation logic
2. Create reusable validation helpers
3. Add schema-based validation support

### Phase 4: Test Refactoring
1. Update client tests first
2. Maintain separate unit/integration patterns
3. Improve mock generation

## Best Practices

### Fixture Management
- Use `generator.ts` for capturing new fixtures
- Keep fixtures minimal and focused
- Version control fixtures
- Document fixture contents

### Test Structure
- Use appropriate test context (`UnitTestContext` or `IntegrationTestContext`)
- Leverage mock factories for unit tests
- Clean up after each test
- Use constants for test IDs (`TEST_IDS`)

### Validation
- Compose validators (unit -> integration)
- Use type assertions carefully
- Add descriptive error messages
- Keep validations focused

## Type Safety
```typescript
// Current types
interface SpotifyFixtures {
  tracks: Record<string, Track>;
  search: Record<string, SearchResponse>;
  playlists: Record<string, PlaylistResponse>;
}

interface GeniusFixtures {
  search: Record<string, GeniusSearchResponse>;
  lyrics: Record<string, string>;
}

// Test context types
interface TestContext {
  constants: {
    ids: typeof TEST_IDS;
  };
}
```

## Goal
Streamline the fixture usage in tests to make them:
1. More maintainable
2. Easier to write
3. More consistent across the codebase
4. Self-documenting
5. Type-safe

## New Architecture

### 1. Fixture Organization
```typescript
// Organized by service and endpoint
fixtures/
  ├── spotify/
  │   ├── tracks/
  │   ├── playlists/
  │   └── search/
  └── genius/
      ├── search/
      └── lyrics/
```

### 2. Fixture Access Pattern
```typescript
// Instead of direct fixture access:
const fixture = fixtures.spotify.getTrack.get(id);

// New fluent API:
const fixture = await fixtures.spotify
  .track(id)
  .expect() // Returns typed fixture with built-in validation
```

### 3. Test Usage
```typescript
describe('getTrack', () => {
  it('should return track for valid id', async () => {
    const id = TEST_IDS.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
    const track = await client.getTrack(id);
    
    // New assertion style
    await fixtures.spotify
      .track(id)
      .matches(track);  // Performs all necessary validations
  });
});
```

### 4. Validation Integration
- Validators should be co-located with fixtures
- Each fixture type should have its own validator
- Validators should be composable and reusable
- Validation should happen automatically when using fixture matchers

## Implementation Steps
1. Create new fixture loader with fluent API
2. Migrate existing fixtures to new structure
3. Create typed fixture matchers
4. Integrate validators with matchers
5. Update tests to use new pattern
6. Add migration guide and documentation

## Benefits
- Reduced boilerplate in tests
- Automatic type checking
- Centralized validation logic
- Clearer test intentions
- Easier fixture maintenance
- Better error messages

## Usage Guidelines
1. Always use the fluent API for fixture access
2. Keep fixtures minimal and focused
3. Use typed matchers for assertions
4. Document any new fixture patterns
5. Keep fixtures in sync with API changes

## Migration Strategy
1. Create new APIs alongside existing ones
2. Gradually migrate tests to new pattern
3. Add new fixtures using new structure
4. Remove old patterns once migration is complete

## Notes
- Keep backwards compatibility during migration
- Add proper error messages for common issues
- Consider adding fixture generation utilities
- Maintain clear separation between unit and integration fixtures

## Fixture Capture and Generation
For capturing new fixtures:
```typescript
// Use the capture utility
await fixtures.spotify
  .track(id)
  .capture();  // Saves response as fixture

// Or with custom transformation
await fixtures.spotify
  .track(id)
  .capture(response => ({
    ...response,
    // Add any custom transformations
  }));
```

## Type Safety
```typescript
// Fixture types should be strictly defined
type SpotifyFixture = {
  tracks: Record<string, SpotifyTrack>;
  playlists: Record<string, SpotifyPlaylist>;
  search: Record<string, SpotifySearchResponse>;
};

// Fixture access should be fully typed
const track = await fixtures.spotify
  .track(id)
  .expect(); // Returns SpotifyTrack

// Matchers should enforce correct types
await fixtures.spotify
  .track(id)
  .matches(response as SpotifyTrack);
``` 