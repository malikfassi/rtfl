import { SpotifyApi, Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { GeniusClientImpl } from '@/lib/clients/genius';
import type { GeniusSearchResponse } from '@/types/genius';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from root .env file
const result = config({ path: '.env' });
console.log('Environment setup:');
console.log('- Loaded env file:', result.parsed ? 'success' : 'failed');
console.log('- GENIUS_ACCESS_TOKEN:', process.env.GENIUS_ACCESS_TOKEN ? 'set' : 'not set');
console.log('- SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? 'set' : 'not set');
console.log('- SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'set' : 'not set');

if (!process.env.GENIUS_ACCESS_TOKEN) {
  throw new Error('GENIUS_ACCESS_TOKEN is required but not set in .env file');
}

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required but not set in .env file');
}

const SONGS = [
  { spotifyId: '3E7dfMvvCLUddWissuqMwr', artist: 'Miley Cyrus' }, // Party in the USA
  { spotifyId: '3MjUtNVVq3C8Fn0MP3zhXa', artist: 'Britney Spears' }, // ...Baby One More Time
  { spotifyId: '7J1uxwnxfQLu4APicE5Rnj', artist: 'Michael Jackson' }, // Billie Jean
  { spotifyId: '1TfqLAPs4K3s2rJMoCokcS', artist: 'Eurythmics' }, // Sweet Dreams
  { spotifyId: '1z3ugFmUKoCzGsI6jdY4Ci', artist: 'Madonna' }, // Like a Prayer
  { spotifyId: '7snQQk1zcKl8gZ92AnueZW', artist: 'Guns N\' Roses' } // Sweet Child O' Mine
];

const PLAYLISTS = [
  { id: '141guhSLUNzE58MqlIC4zT' }, // All Out '80s '90s Hits
  { id: '3sTZTkIGgm8wJiSXDvpApF' }, // Rock Classics (80s, 90s 2000s)
  { id: '2HfFccisPxQfprhgIHM7XH' }  // 90s Rock Classics
];

async function generateFixtures() {
  const spotify = SpotifyApi.withClientCredentials(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!
  );

  const genius = new GeniusClientImpl(process.env.GENIUS_ACCESS_TOKEN!);

  const responses = {
    spotify: {
      tracks: {} as Record<string, Track>,
      searches: {} as Record<string, Awaited<ReturnType<typeof spotify.search>>>,
      playlists: {} as Record<string, SimplifiedPlaylist>,
      playlistTracks: {} as Record<string, Track[]>
    },
    genius: {
      search: {} as Record<string, GeniusSearchResponse>
    }
  };

  const lyricsData = {} as Record<string, {
    lyrics: string;
    maskedLyrics: {
      title: string[];
      artist: string[];
      lyrics: string[];
    };
  }>;

  // Fetch tracks and search results
  for (const song of SONGS.slice(0, 2)) { // Only use first two songs for test models
    try {
      const track = await spotify.tracks.get(song.spotifyId);
      if (!track) continue;
      responses.spotify.tracks[song.spotifyId] = track;
      
      const searchQuery = `${track.name} ${track.artists[0].name}`;
      const searchResponse = await spotify.search(searchQuery, ['track'], undefined, 50);
      if (!searchResponse.tracks) continue;
      responses.spotify.searches[searchQuery] = searchResponse;

      const geniusResponse = await genius.search(searchQuery);
      responses.genius.search[searchQuery] = geniusResponse as unknown as GeniusSearchResponse;

      // Create lyrics data using track ID as key
      const titleWords = track.name.split(/[\s-]+/);
      const artistWords = track.artists[0].name.split(/[\s-]+/);

      // Fetch lyrics using searchSong
      const lyrics = await genius.searchSong(track.name, track.artists[0].name);

      lyricsData[song.spotifyId] = {
        lyrics: lyrics || `Test lyrics for ${track.name}`,
        maskedLyrics: {
          title: titleWords.map(word => word.replace(/([a-zA-Z0-9]|[à-ü]|[À-Ü])/g, '_')),
          artist: artistWords.map(word => word.replace(/([a-zA-Z0-9]|[à-ü]|[À-Ü])/g, '_')),
          lyrics: (lyrics || `Test lyrics for ${track.name}`)
            .split(/[\s\n]+/)
            .map(word => word.replace(/([a-zA-Z0-9]|[à-ü]|[À-Ü])/g, '_'))
        }
      };
    } catch (error) {
      console.error(`Error fetching data for ${song.spotifyId}:`, error);
    }
  }

  // Fetch playlist tracks
  for (const playlist of PLAYLISTS) {
    try {
      const playlistResponse = await spotify.playlists.getPlaylist(playlist.id);
      responses.spotify.playlists[playlist.id] = playlistResponse;

      const tracksResponse = await spotify.playlists.getPlaylistItems(playlist.id);
      if (!tracksResponse.items) continue;
      responses.spotify.playlistTracks[playlist.id] = tracksResponse.items
        .map(item => item.track)
        .filter((track): track is Track => track?.type === 'track');
    } catch (error) {
      console.error(`Error fetching playlist ${playlist.id}:`, error);
    }
  }

  // Create fixtures directory if it doesn't exist
  const fixturesDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/lib/test/fixtures'
  );
  if (!existsSync(fixturesDir)) {
    await mkdir(fixturesDir, { recursive: true });
  }

  // Save JSON files
  await writeFile(
    join(fixturesDir, 'spotify.json'),
    JSON.stringify(responses.spotify, null, 2)
  );

  await writeFile(
    join(fixturesDir, 'genius.json'),
    JSON.stringify(responses.genius, null, 2)
  );

  await writeFile(
    join(fixturesDir, 'lyrics.json'),
    JSON.stringify(lyricsData, null, 2)
  );

  console.log('✅ Fixtures generated successfully');
}

generateFixtures().catch(console.error); 