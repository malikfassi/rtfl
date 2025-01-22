# Fixture Generator Plan

## 1. Generator Script Structure

```typescript
// scripts/generate-fixtures.ts

import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { GeniusClient } from '@/lib/clients/genius';
import { writeFileSync } from 'fs';
import { join } from 'path';

const TEST_SONGS = [
  {
    spotifyId: '5Q0Nhxo0l2bP3pNjpGJwV1',
    searchQuery: 'Party in the USA Miley Cyrus',
    expectedSearchPosition: 0, // Position in search results for validation
  },
  {
    spotifyId: '6gBFPUFcJLzWGx4lenP6h2',
    searchQuery: 'Baby One More Time Britney Spears',
    expectedSearchPosition: 0,
  }
];

interface GeneratedFixtures {
  spotify: {
    tracks: Record<string, SpotifyTrack>;
    searches: Record<string, SpotifyTrack[]>;
    playlists: Record<string, SpotifyPlaylist>;
  };
  genius: {
    lyrics: Record<string, string>;
    searches: Record<string, GeniusSearchResponse>;
  };
}

async function generateFixtures(): Promise<void> {
  const fixtures = await collectData();
  await saveFixtures(fixtures);
}
```

## 2. Data Collection Functions

```typescript
async function collectData(): Promise<GeneratedFixtures> {
  const spotify = SpotifyApi.withClientCredentials(...);
  const genius = new GeniusClient(...);

  const fixtures: GeneratedFixtures = {
    spotify: {
      tracks: {},
      searches: {},
      playlists: {}
    },
    genius: {
      lyrics: {},
      searches: {}
    }
  };

  for (const song of TEST_SONGS) {
    // Collect Spotify data
    const track = await spotify.tracks.get(song.spotifyId);
    fixtures.spotify.tracks[song.spotifyId] = track;

    const searchResults = await spotify.search.getTracks(song.searchQuery);
    fixtures.spotify.searches[song.searchQuery] = searchResults.tracks.items;

    // Collect Genius data
    const artistName = track.artists[0].name;
    const searchKey = `${track.name}-${artistName}`.toLowerCase();
    const lyrics = await genius.searchSong(track.name, artistName);
    fixtures.genius.lyrics[searchKey] = lyrics || null;

    const geniusSearch = await genius.search(`${track.name} ${artistName}`);
    fixtures.genius.searches[searchKey] = geniusSearch;
  }

  return fixtures;
}
```

## 3. File Generation

```typescript
async function saveFixtures(fixtures: GeneratedFixtures): Promise<void> {
  const fixturesDir = join(process.cwd(), 'src/lib/test/fixtures');

  // Save Spotify data
  writeFileSync(
    join(fixturesDir, 'spotify.ts'),
    generateSpotifyFixtureFile(fixtures.spotify)
  );

  // Save Genius data
  writeFileSync(
    join(fixturesDir, 'genius.ts'),
    generateGeniusFixtureFile(fixtures.genius)
  );
}

function generateSpotifyFixtureFile(data: GeneratedFixtures['spotify']): string {
  return `
    import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

    export const spotifyData = ${JSON.stringify(data, null, 2)} as const;

    export type SpotifyFixtures = typeof spotifyData;
  `;
}

function generateGeniusFixtureFile(data: GeneratedFixtures['genius']): string {
  return `
    import type { GeniusSearchResponse } from '@/types/genius';

    export const geniusData = ${JSON.stringify(data, null, 2)} as const;

    export type GeniusFixtures = typeof geniusData;
  `;
}
```

## 4. Validation Functions

```typescript
function validateFixtures(fixtures: GeneratedFixtures): void {
  // Validate Spotify data
  for (const song of TEST_SONGS) {
    if (!fixtures.spotify.tracks[song.spotifyId]) {
      throw new Error(`Missing Spotify track: ${song.spotifyId}`);
    }

    const searchResults = fixtures.spotify.searches[song.searchQuery];
    if (!searchResults?.length) {
      throw new Error(`Missing search results for: ${song.searchQuery}`);
    }

    // Validate search position
    const position = searchResults.findIndex(
      track => track.id === song.spotifyId
    );
    if (position !== song.expectedSearchPosition) {
      throw new Error(
        `Unexpected search position for ${song.spotifyId}: ` +
        `expected ${song.expectedSearchPosition}, got ${position}`
      );
    }
  }

  // Validate Genius data
  for (const song of TEST_SONGS) {
    const track = fixtures.spotify.tracks[song.spotifyId];
    const searchKey = `${track.name}-${track.artists[0].name}`.toLowerCase();

    if (!fixtures.genius.lyrics[searchKey]) {
      throw new Error(`Missing lyrics for: ${searchKey}`);
    }

    if (!fixtures.genius.searches[searchKey]) {
      throw new Error(`Missing Genius search for: ${searchKey}`);
    }
  }
}
```

## 5. Error Handling

```typescript
async function main() {
  try {
    console.log('Generating fixtures...');
    const fixtures = await collectData();

    console.log('Validating fixtures...');
    validateFixtures(fixtures);

    console.log('Saving fixtures...');
    await saveFixtures(fixtures);

    console.log('Fixtures generated successfully!');
  } catch (error) {
    console.error('Error generating fixtures:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

## Implementation Steps

1. **Setup**
   - [ ] Create script file
   - [ ] Add necessary dependencies
   - [ ] Configure TypeScript paths

2. **Data Collection**
   - [ ] Implement Spotify data collection
   - [ ] Implement Genius data collection
   - [ ] Add error handling

3. **File Generation**
   - [ ] Implement file writers
   - [ ] Add type generation
   - [ ] Format output files

4. **Validation**
   - [ ] Add data validation
   - [ ] Add type validation
   - [ ] Add search result validation

5. **Testing**
   - [ ] Test with real API calls
   - [ ] Verify generated files
   - [ ] Test error scenarios

## Notes
- Keep API credentials in environment variables
- Add rate limiting for API calls
- Add progress logging
- Validate generated types match mock usage 