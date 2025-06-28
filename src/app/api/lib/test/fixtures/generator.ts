import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import { GeniusClientImpl } from '@/app/api/lib/clients/genius';
import { env } from '@/app/api/lib/env';
import type { GeniusSearchResponse } from '@/app/types';
import { withRetry } from '@/app/api/lib/utils/retry';
import { TEST_IDS, isErrorCase, isInstrumental, getAllTrackIds } from '../constants';
import { extractLyricsFromHtml } from '@/app/api/lib/services/lyrics';
import { createMaskedLyricsService } from '@/app/api/lib/services/masked-lyrics';

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

// Helper function to extract Spotify ID from URI
export function extractSpotifyId(uri: string): string {
  const parts = uri.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid Spotify URI format: ${uri}`);
  }
  return parts[2];
}

/**
 * Generate data for a song with lyrics
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
    saveFixtureFile('spotify', 'tracks', key, track, 'json');

    // Save track search fixture using the constant key
    const searchQuery = `${track.name} ${track.artists[0].name}`;
    // Fetch real search results from Spotify
    const searchResults = await withRetry(() => spotify.search(searchQuery, ['track']), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Searching Spotify for "${searchQuery}"...`);
      }
    });
    saveSearchFixture('spotify', key, searchQuery, { tracks: searchResults.tracks });

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
    saveFixtureFile('genius', 'search', key, searchResponse, 'json');

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
    saveFixtureFile('genius', 'lyrics', key, html, 'html');

    // Extract lyrics and save as <KEY>.txt
    const extractedLyrics = extractLyricsFromHtml(html);
    if (extractedLyrics && extractedLyrics.length > 0) {
      const lyricsTxtPath = path.join(__dirname, 'data', 'genius', 'lyrics', `${key}.txt`);
      fs.writeFileSync(lyricsTxtPath, extractedLyrics, 'utf-8');
      console.log(`- Extracted lyrics saved to ${lyricsTxtPath}`);

      // Generate and save masked lyrics as <KEY>_MASKED.txt
      const masked = createMaskedLyricsService().create(
        firstHit.result.title,
        firstHit.result.primary_artist?.name || '',
        extractedLyrics
      );
      const maskedLyricsText = masked.lyrics.map(token => token.isToGuess ? '_'.repeat(token.value.length) : token.value).join('');
      const maskedTxtPath = path.join(__dirname, 'data', 'genius', 'lyrics', `${key}_MASKED.txt`);
      fs.writeFileSync(maskedTxtPath, maskedLyricsText, 'utf-8');
      console.log(`- Masked lyrics saved to ${maskedTxtPath}`);
    }

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
 * Generate data for an instrumental track (no lyrics)
 */
async function generateInstrumentalData(uri: string, key: string): Promise<{
  track?: Track;
  error?: { status: number; message: string };
}> {
  const spotifyId = extractSpotifyId(uri);
  console.log(`\nGenerating data for instrumental ${uri}...`);
  try {
    // Fetch track data from Spotify
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
    
    // Save track fixture
    saveFixtureFile('spotify', 'tracks', key, track, 'json');

    // Save track search fixture
    const searchQuery = `${track.name} ${track.artists[0].name}`;
    // Fetch real search results from Spotify
    const searchResults = await withRetry(() => spotify.search(searchQuery, ['track']), {
      onRetry: (attempt) => {
        console.log(`- Retry ${attempt + 1}: Searching Spotify for "${searchQuery}"...`);
      }
    });
    saveSearchFixture('spotify', key, searchQuery, { tracks: searchResults.tracks });

    // For instrumentals, create empty Genius fixtures
    console.log('- Creating empty Genius fixtures for instrumental...');
    
    // Empty search results
    const emptyGeniusSearch = {
      response: {
        hits: []
      }
    };
    saveFixtureFile('genius', 'search', key, emptyGeniusSearch, 'json');
    
    // No lyrics HTML
    const noLyricsHtml = '<html><body><div class="lyrics">No lyrics available - instrumental track</div></body></html>';
    saveFixtureFile('genius', 'lyrics', key, noLyricsHtml, 'html');

    console.log('✓ Instrumental data generated successfully');
    return { track };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error(`✗ Error generating data for instrumental ${uri}:`, err.message || 'Unknown error');
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
    saveFixtureFile('spotify', 'playlists', key, playlist, 'json');

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
    saveSearchFixture('spotify', key, playlist.name, { playlists: { items: [playlist] } });

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

async function generateSpecialCaseFixtures() {
  console.log('\nGenerating special case fixtures...');

  // Get key names generically
  const noResultsKeyName = Object.entries(TEST_IDS.GENIUS.QUERIES)
    .find((entry) => entry[1] === TEST_IDS.GENIUS.QUERIES.NO_RESULTS)?.[0] || 'NO_RESULTS';

  // Generate NO_RESULTS search fixture for Genius
  console.log('- Searching Genius for no results query...');
  try {
    const noResultsResponse = await genius.search(TEST_IDS.GENIUS.QUERIES.NO_RESULTS);
    saveFixtureFile('genius', 'search', noResultsKeyName, noResultsResponse);
  } catch (error) {
    console.error('Error searching Genius for no results:', error);
    // Save the error response if the API call fails
    saveFixtureFile('genius', 'search', noResultsKeyName, { error });
  }

  // Generate fixtures for all error cases
  for (const [key, value] of Object.entries(TEST_IDS.SPOTIFY.ERROR_CASES)) {
    console.log(`\nGenerating error case fixtures for ${key}...`);
    
    // Handle different error cases
    if (key === 'INVALID_FORMAT') {
      // For invalid format, create error fixtures without API calls
      console.log('- Creating error fixtures for invalid format...');
      
      // Spotify track error
      const spotifyError = {
        error: {
          status: 400,
          message: "Invalid id"
        }
      };
      saveFixtureFile('spotify', 'tracks', key, spotifyError, 'json');
      
      // Empty search results
      saveFixtureFile('spotify', 'search', key, { tracks: { items: [] } }, 'json');
      saveFixtureFile('genius', 'search', key, { response: { hits: [] } }, 'json');
      
      // Error HTML for lyrics
      const errorHtml = '<html><body><h1>400 Bad Request</h1><p>Invalid format</p></body></html>';
      saveFixtureFile('genius', 'lyrics', key, errorHtml, 'html');
      
    } else if (key === 'NOT_FOUND') {
      // For not found, make real API calls to get actual 404 responses
      const spotifyId = extractSpotifyId(value);
      
      // 1. Try to get the track from Spotify (expect 404)
      console.log(`- Fetching Spotify track for non-existent ID: ${spotifyId}...`);
      try {
        const track = await spotify.tracks.get(spotifyId);
        // If somehow it exists, save it
        saveFixtureFile('spotify', 'tracks', key, track, 'json');
      } catch (error: unknown) {
        // Save the actual error response from Spotify
        const err = error as { status?: number; message?: string };
        console.log('- Got expected error from Spotify:', err.message);
        const errorResponse = {
          error: {
            status: err.status || 404,
            message: err.message || "Non existing id"
          }
        };
        saveFixtureFile('spotify', 'tracks', key, errorResponse, 'json');
      }

      // 2. Search Spotify for a non-existent track
      console.log('- Searching Spotify for non-existent track...');
      try {
        const searchResults = await spotify.search('completely nonexistent track name 123456789', ['track']);
        saveFixtureFile('spotify', 'search', key, searchResults, 'json');
      } catch (error) {
        console.error('Error searching Spotify:', error);
        saveFixtureFile('spotify', 'search', key, { error });
      }

      // 3. Search Genius for a non-existent track
      console.log('- Searching Genius for non-existent track...');
      try {
        const geniusResults = await genius.search('completely nonexistent track name 123456789');
        saveFixtureFile('genius', 'search', key, geniusResults, 'json');
      } catch (error) {
        console.error('Error searching Genius:', error);
        saveFixtureFile('genius', 'search', key, { error });
      }

      // 4. For Genius lyrics, create a 404 error page
      const errorHtml = '<html><body><h1>404 Not Found</h1><p>Page not found</p></body></html>';
      saveFixtureFile('genius', 'lyrics', key, errorHtml, 'html');
    }
  }

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

    // Generate song data with lyrics
    console.log('\nGenerating song data with lyrics...');
    const songResults = await Promise.all(
      Object.entries(TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS).map(async ([key, uri]) => {
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

    // Generate instrumental track data
    console.log('\nGenerating instrumental track data...');
    const instrumentalResults = await Promise.all(
      Object.entries(TEST_IDS.SPOTIFY.TRACKS.INSTRUMENTAL).map(async ([key, uri]) => {
        try {
          await delay(1000);
          const result = await generateInstrumentalData(uri, key);
          return {
            key,
            uri,
            ...result
          };
        } catch (error) {
          console.error(`Error processing instrumental ${uri}:`, error);
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
    console.log('Songs with lyrics:', {
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

    // Instrumentals summary
    const successfulInstrumentals = instrumentalResults.filter(r => r.track);
    const failedInstrumentals = instrumentalResults.filter(r => r.error);
    console.log('Instrumental tracks:', {
      total: instrumentalResults.length,
      successful: successfulInstrumentals.length,
      failed: failedInstrumentals.length
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
    const allErrors = [...failedSongs, ...failedInstrumentals, ...failedPlaylists];
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

/**
 * Generate data for a single track by key
 */
async function generateSingleTrack(key: string) {
  console.log(`\nGenerating single track: ${key}`);
  
  // Find the track URI from constants
  const allTracks = getAllTrackIds();
  const uri = allTracks[key as keyof typeof allTracks];
  
  if (!uri) {
    console.error(`No track found with key: ${key}`);
    return;
  }
  
  // Ensure directories exist
  createFixtureDirectories();
  
  // Check if it's an error case
  if (isErrorCase(uri)) {
    console.log('This is an error case - regenerating special case fixtures...');
    await generateSpecialCaseFixtures();
    return;
  }
  
  // Check if it's instrumental
  if (isInstrumental(uri)) {
    const result = await generateInstrumentalData(uri, key);
    console.log(result.error ? `Failed: ${result.error.message}` : 'Success!');
    return;
  }
  
  // It's a regular song with lyrics
  const result = await generateSongData(uri, key);
  console.log(result.error ? `Failed: ${result.error.message}` : 'Success!');
}

// Run if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('Starting fixture generation script...');
  
  // Check if running with a specific track key
  const trackKey = process.argv[2];
  if (trackKey) {
    generateSingleTrack(trackKey).catch(error => {
      console.error('\n✗ Fatal Error:', error);
      console.error('Error details:', error.stack);
      process.exit(1);
    });
  } else {
    generateFixtures().catch(error => {
      console.error('\n✗ Fatal Error:', error);
      console.error('Error details:', error.stack);
      process.exit(1);
    });
  }
}

export { generateFixtures, generatePlaylistData, generateSongData, generateSingleTrack };

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
function saveFixtureFile(service: string, type: string, key: string, data: unknown, extension: string = 'json') {
  const fileName = key;
  const filePath = path.join(__dirname, 'data', service, type, `${fileName}.${extension}`);
  const content = extension === 'json' ? JSON.stringify(data, null, 2) : String(data);
  writeFileSync(filePath, content);
  console.log(`✓ Saved ${service}/${type}/${fileName}.${extension}`);
}

// Helper to save search fixture
function saveSearchFixture(service: string, key: string, query: string, data: unknown) {
  saveFixtureFile(service, 'search', key, data, 'json');
}

// Helper to recursively delete a directory
function cleanDataFolder() {
  const baseDir = path.join(__dirname, 'data');
  if (fs.existsSync(baseDir)) {
    fs.rmSync(baseDir, { recursive: true, force: true });
    console.log('✓ Cleaned data folder');
  }
}



