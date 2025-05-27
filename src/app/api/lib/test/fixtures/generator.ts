import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import { GeniusClientImpl } from '@/app/api/lib/clients/genius';
import { env } from '@/app/api/lib/env';
import type { GeniusSearchResponse } from '@/app/api/lib/types/genius';
import { withRetry } from '@/app/api/lib/utils/retry';
import { TEST_IDS } from '@/app/api/lib/test/constants';

// Import delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
function validateEnv() {
  const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'GENIUS_ACCESS_TOKEN'];
  const missingVars = requiredEnvVars.filter(varName => !env[varName as keyof typeof env]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please set these variables in your .env file or environment before running the fixture generator.');
  }
}

// Initialize clients
console.log('Validating environment variables...');
validateEnv();
console.log('Environment validation successful');

console.log('Initializing API clients...');
const spotify = SpotifyApi.withClientCredentials(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
const genius = new GeniusClientImpl(env.GENIUS_ACCESS_TOKEN);
console.log('API clients initialized successfully');

interface SpotifyData {
  tracks: Partial<Record<string, Track>>;
  playlists: Partial<Record<string, SimplifiedPlaylist>>;
  playlistTracks: Partial<Record<string, Track[]>>;
  errors: {
    tracks: Partial<Record<string, { status: number; message: string }>>;
    playlists: Partial<Record<string, { status: number; message: string }>>;
  };
}

interface GeniusData {
  byId: Partial<Record<string, {
    url: string;
    title: string;
    artist: string;
    search: GeniusSearchResponse;
  }>>;
}

type LyricsData = Partial<Record<string, string>>;

// Helper function to extract Spotify ID from URI
function extractSpotifyId(uri: string): string {
  const parts = uri.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid Spotify URI format: ${uri}`);
  }
  return parts[2];
}

/**
 * Generate data for a song
 */
async function generateSongData(uri: string, key: string): Promise<{
  track?: Track;
  geniusSearch?: GeniusSearchResponse;
  error?: { status: number; message: string };
}> {
  const spotifyId = extractSpotifyId(uri);
  console.log(`\nGenerating data for song ${uri}...`);
  try {
    // Fetch data from APIs with retry
    console.log('- Fetching Spotify track data...');
    const track = await withRetry(() => spotify.tracks.get(spotifyId), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Fetching Spotify track data...`);
      }
    });
    if (!track) {
      throw new Error(`No track found for ID: ${spotifyId}`);
    }
    console.log(`- Spotify track data fetched: "${track.name}" by ${track.artists[0].name}`);
    
    // Save track fixture using the constant key
    saveFixtureFile('spotify', 'tracks', spotifyId, track, 'json', key);

    // Save track search fixture using the constant key
    const searchQuery = `${track.name} ${track.artists[0].name}`;
    saveSearchFixture('spotify', spotifyId, searchQuery, { tracks: { items: [track] } }, key);

    console.log('- Searching Genius...');
    console.log(`- Search query: "${searchQuery}"`);
    const searchResponse = await withRetry(() => genius.search(searchQuery), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Searching Genius...`);
      }
    });
    if (!searchResponse?.response?.hits?.length) {
      throw new Error(`No Genius results found for: ${searchQuery}`);
    }
    const firstHit = searchResponse.response.hits[0];
    if (!firstHit?.result?.title || !firstHit?.result?.primary_artist?.name) {
      throw new Error('Invalid Genius search result structure');
    }
    console.log(`- Found ${searchResponse.response.hits.length} Genius results`);
    console.log(`- Best match: "${firstHit.result.title}" by ${firstHit.result.primary_artist.name}`);

    // Save Genius search fixture using the constant key
    saveFixtureFile('genius', 'search', spotifyId, searchResponse, 'json', key);

    const lyricsUrl = firstHit.result.url;
    if (!lyricsUrl) {
      throw new Error('No lyrics URL found in Genius search result');
    }

    console.log('- Fetching lyrics page HTML...');
    const html = await withRetry(() => genius.fetchLyricsPage(lyricsUrl), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Fetching lyrics page HTML...`);
        // Add exponential backoff delay between retries
        return delay(Math.min(1000 * Math.pow(2, attempt), 10000));
      }
    });
    if (!html) {
      throw new Error(`No HTML found at URL: ${lyricsUrl}`);
    }
    console.log(`- Lyrics page HTML fetched (${html.length} characters)`);

    // Save raw HTML as fixture using the constant key
    saveFixtureFile('genius', 'lyrics', spotifyId, html, 'html', key);

    // Add delay after successful lyrics fetch
    await delay(2000);

    console.log('✓ Data generated successfully');
    return { track, geniusSearch: searchResponse };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error(`✗ Error generating data for song ${uri}:`, err.message || 'Unknown error');
    return {
      error: { 
        status: err.status || 500, 
        message: err.message || 'Unknown error' 
      }
    };
  }
}

/**
 * Generate data for a playlist
 */
async function generatePlaylistData(uri: string, key: string): Promise<{
  playlist?: SimplifiedPlaylist;
  tracks?: Track[];
  error?: { status: number; message: string };
}> {
  const spotifyId = extractSpotifyId(uri);
  console.log(`\nGenerating data for playlist ${uri}...`);
  try {
    // Get playlist metadata with retry
    console.log('- Fetching playlist metadata...');
    const playlist = await withRetry(() => spotify.playlists.getPlaylist(spotifyId), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Fetching playlist metadata...`);
      }
    });
    if (!playlist) {
      throw new Error(`No playlist found for ID: ${spotifyId}`);
    }
    console.log(`- Playlist metadata fetched: "${playlist.name}" by ${playlist.owner.display_name}`);

    // Save playlist fixture using the constant key
    saveFixtureFile('spotify', 'playlists', spotifyId, playlist, 'json', key);

    // Get playlist tracks with retry
    console.log('- Fetching playlist tracks...');
    const playlistItems = await withRetry(() => spotify.playlists.getPlaylistItems(spotifyId), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Fetching playlist tracks...`);
      }
    });
    const tracks = playlistItems.items
      .map(item => item.track)
      .filter((track): track is Track => 
        track !== null && 'id' in track && track.type === 'track'
      );
    
    if (!tracks.length) {
      throw new Error(`No tracks found in playlist: ${spotifyId}`);
    }
    console.log(`- Found ${tracks.length} tracks`);
    console.log(`- Sample tracks:\n${tracks.slice(0, 3).map(t => `  • "${t.name}" by ${t.artists[0].name}`).join('\n')}`);

    // Save playlist search fixture using the constant key
    saveSearchFixture('spotify', spotifyId, playlist.name, { playlists: { items: [playlist] } }, key);

    console.log('✓ Data generated successfully');
    return { playlist, tracks };
  } catch (error) {
    const err = error as { status?: number; message?: string };
    console.error(`✗ Error generating data for playlist ${uri}:`, err.message || 'Unknown error');
    return {
      error: { 
        status: err.status || 500,
        message: err.message || 'Unknown error'
      }
    };
  }
}

// Modify batch processing to be sequential with longer delays
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = await processor(item);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    
    // Add delay between items
    if (i < items.length - 1) {
      await delay(1000);
    }
  }
  
  return results;
}

async function generateSpecialCaseFixtures() {
  console.log('\nGenerating special case fixtures...');

  // Generate NO_RESULTS search fixture
  const noResultsSearch = {
    response: {
      hits: []
    }
  };
  saveFixtureFile('genius', 'search', 'no_results', noResultsSearch);

  // Generate NO_LYRICS fixture
  const noLyricsHtml = '<div class="lyrics">No lyrics available</div>';
  saveFixtureFile('genius', 'lyrics', 'no_lyrics', noLyricsHtml, 'html');

  console.log('✓ Special case fixtures generated');
}

/**
 * Main function to generate all test data
 */
async function generateFixtures() {
  console.log('Starting fixture generation...');
  try {
    // Clean data folder before generating new fixtures
    cleanDataFolder();
    // Create directory structure
    createFixtureDirectories();

    // Generate special case fixtures first
    await generateSpecialCaseFixtures();

    // Generate song data
    console.log('\nGenerating song data...');
    const songResults = await Promise.all(
      Object.entries(TEST_IDS.SPOTIFY.TRACKS).map(async ([key, uri]) => {
        try {
          // Process songs sequentially with delay to avoid rate limits
          await delay(1000);
          const result = await generateSongData(uri, key);
          return {
            key,
            uri,
            ...result
          };
        } catch (error) {
          console.error(`Error processing song ${uri}:`, error);
          return {
            key,
            uri,
            error: {
              status: 400,
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      })
    );

    // Generate playlist data
    console.log('\nGenerating playlist data...');
    const playlistResults = await Promise.all(
      Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).map(async ([key, uri]) => {
        try {
          // Process playlists sequentially with delay to avoid rate limits
          await delay(1000);
          const result = await generatePlaylistData(uri, key);
          return {
            key,
            uri,
            ...result
          };
          } catch (error) {
          console.error(`Error processing playlist ${uri}:`, error);
          return {
            key,
            uri,
            error: {
              status: 400,
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      })
    );

    // Print summary
    console.log('\n=== Generation Summary ===');
    
    // Songs summary
    const successfulSongs = songResults.filter(r => r.track);
    const failedSongs = songResults.filter(r => r.error);
    console.log('Songs:', {
      total: songResults.length,
      successful: successfulSongs.length,
      failed: failedSongs.length,
      details: songResults.map(r => ({
        key: r.key,
        uri: r.uri,
        success: !!r.track,
        error: r.error?.message
      }))
    });

    // Playlists summary
    const successfulPlaylists = playlistResults.filter(r => r.playlist);
    const failedPlaylists = playlistResults.filter(r => r.error);
    console.log('Playlists:', {
      total: playlistResults.length,
      successful: successfulPlaylists.length,
      failed: failedPlaylists.length,
      details: playlistResults.map(r => ({
        key: r.key,
        uri: r.uri,
        success: !!r.playlist,
        error: r.error?.message
      }))
    });

    // Print error summary if any
    const allErrors = [...failedSongs, ...failedPlaylists];
    if (allErrors.length > 0) {
      console.log('\n=== Error Summary ===');
      allErrors.forEach(({ key, uri, error }) => {
        console.error(`- ${key} (${uri}): ${error?.message}`);
      });
    }

  } catch (error) {
    console.error('Fatal error during fixture generation:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('Starting fixture generation script...');
  generateFixtures().catch(error => {
    console.error('\n✗ Fatal Error:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  });
}

export { generateFixtures, generatePlaylistData, generateSongData };

// Helper to create directory structure
function createFixtureDirectories() {
  const baseDir = path.join(__dirname, 'data');
  const directories = [
    path.join(baseDir, 'spotify', 'tracks'),
    path.join(baseDir, 'spotify', 'playlists'),
    path.join(baseDir, 'spotify', 'search'),
    path.join(baseDir, 'genius', 'search'),
    path.join(baseDir, 'genius', 'lyrics')
  ];

  // Create base directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Create subdirectories
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  return baseDir;
}

// Helper to save individual fixture files
function saveFixtureFile(service: string, type: string, id: string, data: any, extension: string = 'json', key?: string) {
  // Always use the constant key if provided
  const fileName = key || id;
  const filePath = path.join(__dirname, 'data', service, type, `${fileName}.${extension}`);
  const content = extension === 'json' ? JSON.stringify(data, null, 2) : data;
  writeFileSync(filePath, content);
  console.log(`✓ Saved ${service}/${type}/${fileName}.${extension}`);
}

// Helper to save search fixture
function saveSearchFixture(service: string, id: string, query: string, data: any, key?: string) {
  const searchId = key || id;
  saveFixtureFile(service, 'search', searchId, data, 'json', key);
}

// Helper to recursively delete a directory
function cleanDataFolder() {
  const baseDir = path.join(__dirname, 'data');
  if (fs.existsSync(baseDir)) {
    fs.rmSync(baseDir, { recursive: true, force: true });
    console.log('✓ Cleaned data folder');
  }
}



