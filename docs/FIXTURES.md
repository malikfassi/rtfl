# Test Fixtures

Test fixtures are generated from real API responses for consistent test data. The `generate-fixtures.ts` script captures API responses and generates TypeScript types.

## Structure

```typescript
export const TEST_CASES = {
  SONGS: {
    VALID: {
      id: string,
      spotify_track: SpotifyTrackResponse,
      spotify_search: SpotifySearchResponse,
      genius_search: GeniusSearchResponse,
      genius_lyrics: string,
      masked_lyrics: {
        title: string,
        artist: string,
        lyrics: string
      }
    },
    INSTRUMENTAL: {
      // Same structure as VALID but with null lyrics
    },
    NOT_FOUND: {
      // All fields null except id
    }
  },
  PLAYLISTS: {
    VALID: {
      id: string,
      spotify_playlist: SpotifyPlaylistResponse,
      spotify_tracks: SpotifyTracksResponse
    }
  }
} as const;
```

## Directory Structure

```
src/lib/test/
├── fixtures/
│   ├── json/           # Raw API responses
│   ├── test-cases/     # Generated TypeScript
│   └── index.ts        # Exports
```

## Client Mocks

```typescript
// Mock setup using fixtures
const setupMocks = (testCase: TestCase) => ({
  spotify: {
    getTrack: jest.fn().mockResolvedValue(testCase.spotify_track),
    search: jest.fn().mockResolvedValue(testCase.spotify_search)
  },
  genius: {
    search: jest.fn().mockResolvedValue(testCase.genius_search),
    getLyrics: jest.fn().mockResolvedValue(testCase.genius_lyrics)
  }
});
```

## Validation Helpers

```typescript
// Unit test validators (complete validation)
export const validators = {
  unit: {
    song: (actual: any, testCase: TestCase) => {
      expect(actual).toMatchObject({
        spotifyId: testCase.id,
        spotifyData: testCase.spotify_track,
        geniusData: testCase.genius_search,
        lyrics: testCase.genius_lyrics,
        maskedLyrics: testCase.masked_lyrics
      });
    },
    playlist: (actual: any, testCase: TestCase) => {
      expect(actual).toMatchObject({
        id: testCase.id,
        spotifyData: testCase.spotify_playlist,
        tracks: testCase.spotify_tracks
      });
    }
  },
  
  // Integration test validators (essential properties)
  integration: {
    song: (actual: any, testCase: TestCase) => {
      expect(actual).toMatchObject({
        spotifyId: testCase.id,
        spotifyData: {
          id: testCase.spotify_track.id,
          uri: testCase.spotify_track.uri
        },
        lyrics: testCase.genius_lyrics
      });
    },
    playlist: (actual: any, testCase: TestCase) => {
      expect(actual).toMatchObject({
        id: testCase.id,
        spotifyData: {
          id: testCase.spotify_playlist.id,
          uri: testCase.spotify_playlist.uri
        }
      });
    }
  }
};
```

## Usage Example

```typescript
// Unit test
test('creates song from track', () => {
  const testCase = TEST_CASES.SONGS.VALID;
  const result = createSongFromTrack(testCase.spotify_track);
  validators.unit.song(result, testCase);
});

// Integration test
test('returns song from API', async () => {
  const testCase = TEST_CASES.SONGS.VALID;
  const response = await GET(`/api/songs/${testCase.id}`);
  const data = await response.json();
  validators.integration.song(data, testCase);
});
```

## Best Practices

- Use generated fixtures instead of hardcoded responses
- Keep fixture generation in sync with API changes
- Version control fixture data
- Document special cases in the generation script
