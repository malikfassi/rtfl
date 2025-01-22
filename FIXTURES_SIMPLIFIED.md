# Simplified Fixtures Approach

## 1. Capture Real API Responses

### Spotify Responses
```typescript
// src/lib/test/fixtures/spotify.ts

// Response from GET /tracks/{id}
export const trackResponse = {
  "id": "5Q0Nhxo0l2bP3pNjpGJwV1",
  "name": "Party in the U.S.A.",
  "preview_url": "...",
  "artists": [...],
  "album": {
    "images": [...]
  },
  // ... rest of actual Spotify response
};

// Response from GET /search?type=track
export const searchTracksResponse = {
  "tracks": {
    "items": [...],
    // ... rest of actual Spotify search response
  }
};

// Response from GET /playlists/{id}
export const playlistResponse = {
  "id": "...",
  "name": "Test Playlist",
  "tracks": {
    "items": [...],
    // ... rest of actual Spotify playlist response
  }
};
```

### Genius Responses
```typescript
// src/lib/test/fixtures/genius.ts

// Response from /search endpoint
export const searchResponse = {
  "meta": { "status": 200 },
  "response": {
    "hits": [
      {
        "result": {
          "id": 123,
          "title": "Party in the U.S.A.",
          "primary_artist": {
            "name": "Miley Cyrus"
          },
          // ... rest of actual Genius response
        }
      }
    ]
  }
};

// Response from lyrics scraping
export const lyricsResponse = {
  "lyrics": "I hopped off the plane at L.A.X...",
  // ... actual scraped lyrics
};
```

## 2. Usage in Tests

### Mock Spotify Client
```typescript
// src/lib/test/mocks/spotify.ts
import { trackResponse, searchTracksResponse, playlistResponse } from '../fixtures/spotify';

export const mockSpotifyClient = {
  getTrack: jest.fn().mockResolvedValue(trackResponse),
  searchTracks: jest.fn().mockResolvedValue(searchTracksResponse.tracks.items),
  getPlaylist: jest.fn().mockResolvedValue(playlistResponse),
  getPlaylistTracks: jest.fn().mockResolvedValue(playlistResponse.tracks.items)
};
```

### Mock Genius Client
```typescript
// src/lib/test/mocks/genius.ts
import { searchResponse, lyricsResponse } from '../fixtures/genius';

export const mockGeniusClient = {
  searchSong: jest.fn().mockResolvedValue(lyricsResponse.lyrics)
};
```

## 3. Implementation Steps

1. Create a script to fetch and save responses:
```typescript
// scripts/generate-fixtures.ts
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { writeFileSync } from 'fs';

async function generateFixtures() {
  const spotify = SpotifyApi.withClientCredentials(...);
  
  // Fetch real responses
  const track = await spotify.tracks.get('5Q0Nhxo0l2bP3pNjpGJwV1');
  const search = await spotify.search.getTracks('Party in the USA');
  const playlist = await spotify.playlists.get('...');
  
  // Save to files
  writeFileSync(
    'src/lib/test/fixtures/spotify.ts',
    `export const trackResponse = ${JSON.stringify(track, null, 2)};`
  );
  // ... save other responses
}
```

2. Use in tests:
```typescript
// src/lib/services/__tests__/song.test.ts
import { trackResponse } from '@/lib/test/fixtures/spotify';
import { lyricsResponse } from '@/lib/test/fixtures/genius';

describe('SongService', () => {
  it('creates song successfully', async () => {
    mockSpotifyClient.getTrack.mockResolvedValue(trackResponse);
    mockGeniusClient.searchSong.mockResolvedValue(lyricsResponse.lyrics);
    
    const result = await songService.create(trackResponse.id);
    expect(result.spotifyData).toEqual(trackResponse);
    expect(result.lyrics).toEqual(lyricsResponse.lyrics);
  });
});
```

## Benefits
1. Real data structure from APIs
2. No need to maintain mock data structures
3. Easy to update by re-running generator
4. Guaranteed API compatibility
5. Single source of truth for test data

## Next Steps
1. Create the generator script
2. Run it against real APIs
3. Save responses as fixtures
4. Update tests to use these responses 