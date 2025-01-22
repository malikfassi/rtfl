# Simple Fixture Generator

```typescript
// scripts/generate-fixtures.ts
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { GeniusClient } from '@/lib/clients/genius';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Just the songs we need for tests
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

async function main() {
  try {
    // 1. Get Spotify data
    const spotify = SpotifyApi.withClientCredentials(...);
    const spotifyData = {
      tracks: {},
      searches: {}
    };

    for (const song of SONGS) {
      // Get track
      const track = await spotify.tracks.get(song.spotifyId);
      spotifyData.tracks[song.spotifyId] = track;
      
      // Get search results
      const search = await spotify.search.getTracks(`${track.name} ${song.artist}`);
      spotifyData.searches[song.spotifyId] = search.tracks.items;
    }

    // 2. Get Genius data
    const genius = new GeniusClient(...);
    const geniusData = {
      lyrics: {}
    };

    for (const song of SONGS) {
      const track = spotifyData.tracks[song.spotifyId];
      const lyrics = await genius.searchSong(track.name, song.artist);
      geniusData.lyrics[song.spotifyId] = lyrics;
    }

    // 3. Save files
    writeFileSync(
      join(process.cwd(), 'src/lib/test/fixtures/spotify.ts'),
      `export const spotifyData = ${JSON.stringify(spotifyData, null, 2)};`
    );

    writeFileSync(
      join(process.cwd(), 'src/lib/test/fixtures/genius.ts'),
      `export const geniusData = ${JSON.stringify(geniusData, null, 2)};`
    );

    console.log('Fixtures generated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
```

That's it! This will:
1. Fetch Spotify tracks and search results
2. Fetch Genius lyrics
3. Save everything in our fixtures directory

Then we can focus on the mock implementations as planned in MOCK_USAGE_PLAN.md. 