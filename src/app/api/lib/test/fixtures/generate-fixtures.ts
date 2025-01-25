import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { writeFileSync } from 'fs';
import { dirname,join } from 'path';
import { fileURLToPath } from 'url';

import { GeniusClientImpl } from '@/app/api/lib/clients/genius';
import { env } from '@/app/api/lib/env';
import type { GeniusSearchResponse } from '@/app/types/genius';
import { withRetry } from '@/app/api/lib/utils/retry';

// Import delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test Case Generator
 * 
 * This module generates test data directly from Spotify and Genius APIs.
 * The data is saved as JSON files and used by the test case wrapper.
 */

import { PLAYLIST_IDS, type PlaylistId,SONG_IDS, type SpotifyId } from './spotify_ids';

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
  tracks: Partial<Record<SpotifyId, Track>>;
  playlists: Partial<Record<PlaylistId, SimplifiedPlaylist>>;
  playlistTracks: Partial<Record<PlaylistId, Track[]>>;
  errors: {
    tracks: Partial<Record<SpotifyId, { status: number; message: string }>>;
    playlists: Partial<Record<PlaylistId, { status: number; message: string }>>;
  };
}

interface GeniusData {
  byId: Partial<Record<SpotifyId, {
    url: string;
    title: string;
    artist: string;
  }>>;
  byQuery: Record<string, GeniusSearchResponse>;
}

type LyricsData = Partial<Record<SpotifyId, string>>;

// Add these utility functions at the top level

/**
 * Generate data for a song
 */
async function generateSongData(id: SpotifyId): Promise<{
  track?: Track;
  geniusSearch?: GeniusSearchResponse;
  lyrics?: string;
  error?: { status: number; message: string };
}> {
  console.log(`\nGenerating data for song ${id}...`);
  try {
    // Fetch data from APIs with retry
    console.log('- Fetching Spotify track data...');
    const track = await withRetry(() => spotify.tracks.get(id), {
      onRetry: (attempt, waitTime, error) => {
        console.log(`- Retry ${attempt + 1}: Fetching Spotify track data...`);
      }
    });
    if (!track) {
      throw new Error(`No track found for ID: ${id}`);
    }
    console.log(`- Spotify track data fetched: "${track.name}" by ${track.artists[0].name}`);

    console.log('- Searching Genius...');
    const searchQuery = `${track.name} ${track.artists[0].name}`;
    console.log(`- Search query: "${searchQuery}"`);
    const searchResponse = await withRetry(() => genius.search(searchQuery), {
      onRetry: (attempt, waitTime, error) => {
        console.log(`- Retry ${attempt + 1}: Searching Genius...`);
      }
    });
    if (!searchResponse.response.hits.length) {
      throw new Error(`No Genius results found for: ${searchQuery}`);
    }
    console.log(`- Found ${searchResponse.response.hits.length} Genius results`);
    console.log(`- Best match: "${searchResponse.response.hits[0].result.title}" by ${searchResponse.response.hits[0].result.primary_artist.name}`);

    console.log('- Fetching lyrics...');
    const lyrics = await withRetry(() => genius.getLyrics(searchResponse.response.hits[0].result.url), {
      onRetry: (attempt, waitTime, error) => {
        console.log(`- Retry ${attempt + 1}: Fetching lyrics...`);
      }
    });
    if (!lyrics) {
      throw new Error(`No lyrics found at URL: ${searchResponse.response.hits[0].result.url}`);
    }
    console.log(`- Lyrics fetched (${lyrics.length} characters)`);

    console.log('✓ Data generated successfully');
    return { track, geniusSearch: searchResponse, lyrics };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error(`✗ Error generating data for song ${id}:`, err.message || 'Unknown error');
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
async function generatePlaylistData(id: PlaylistId): Promise<{
  playlist?: SimplifiedPlaylist;
  tracks?: Track[];
  error?: { status: number; message: string };
}> {
  console.log(`\nGenerating data for playlist ${id}...`);
  try {
    // Get playlist metadata with retry
    console.log('- Fetching playlist metadata...');
    const playlist = await withRetry(() => spotify.playlists.getPlaylist(id), {
      onRetry: (attempt, waitTime, error) => {
        console.log(`- Retry ${attempt + 1}: Fetching playlist metadata...`);
      }
    });
    if (!playlist) {
      throw new Error(`No playlist found for ID: ${id}`);
    }
    console.log(`- Playlist metadata fetched: "${playlist.name}" by ${playlist.owner.display_name}`);

    // Get playlist tracks with retry
    console.log('- Fetching playlist tracks...');
    const playlistItems = await withRetry(() => spotify.playlists.getPlaylistItems(id), {
      onRetry: (attempt, waitTime, error) => {
        console.log(`- Retry ${attempt + 1}: Fetching playlist tracks...`);
      }
    });
    const tracks = playlistItems.items
      .map(item => item.track)
      .filter((track): track is Track => 
        track !== null && 'id' in track && track.type === 'track'
      );
    
    if (!tracks.length) {
      throw new Error(`No tracks found in playlist: ${id}`);
    }
    console.log(`- Found ${tracks.length} tracks`);
    console.log(`- Sample tracks:\n${tracks.slice(0, 3).map(t => `  • "${t.name}" by ${t.artists[0].name}`).join('\n')}`);

    console.log('✓ Data generated successfully');
    return { playlist, tracks };
  } catch (error) {
    const err = error as { status?: number; message?: string };
    console.error(`✗ Error generating data for playlist ${id}:`, err.message || 'Unknown error');
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
    
  }
  
  return results;
}

/**
 * Main function to generate all test data
 */
async function generateFixtures() {
  console.log('\n=== Starting Fixture Generation ===\n');
  
  // Initialize data structures
  const spotifyData: SpotifyData = {
    tracks: {},
    playlists: {},
    playlistTracks: {},
    errors: {
      tracks: {},
      playlists: {}
    }
  };
  const geniusData: GeniusData = {
    byId: {},
    byQuery: {}
  };
  const lyricsData: LyricsData = {};

  // Generate song data
  console.log('\n=== Generating Song Data ===');
  const songEntries = Object.entries(SONG_IDS);
  console.log(`Songs to process: ${songEntries.length}`);
  
  let successfulSongs = 0;
  let failedSongs = 0;
  
  // Process songs sequentially with longer delays
  const songResults = await processBatch(
    songEntries,
    async ([key, id]) => {
      console.log(`\nProcessing song [${key}]: ${id}`);
      const data = await generateSongData(id);
      
      // Add a small delay between API calls within the same song
      if (data.track) {
        await delay(2000); // Wait 2s before Genius search
      }
      
      if (data.track && data.geniusSearch && data.lyrics) {
        spotifyData.tracks[id] = data.track;
        // Store only the best match from Genius search
        const bestMatch = data.geniusSearch.response.hits[0];
        geniusData.byId[id] = {
          url: bestMatch.result.url,
          title: bestMatch.result.title,
          artist: bestMatch.result.primary_artist.name
        };
        lyricsData[id] = data.lyrics;
        successfulSongs++;
        return { success: true, id };
      } else if (data.error) {
        spotifyData.errors.tracks[id] = data.error;
        failedSongs++;
        return { success: false, id };
      }
      return { success: false, id };
    },
    (processed, total) => {
      console.log(`Progress: ${processed}/${total} songs processed`);
    }
  );
  // Generate playlist data
  console.log('\n=== Generating Playlist Data ===');
  const playlistEntries = Object.entries(PLAYLIST_IDS);
  console.log(`Playlists to process: ${playlistEntries.length}`);
  
  let successfulPlaylists = 0;
  let failedPlaylists = 0;
  
  // Process playlists sequentially
  for (const [key, id] of playlistEntries) {
    console.log(`\nProcessing playlist [${key}]: ${id}`);
    const data = await generatePlaylistData(id);
    
    if (data.playlist && data.tracks) {
      spotifyData.playlists[id] = data.playlist;
      spotifyData.playlistTracks[id] = data.tracks;
      successfulPlaylists++;
    } else if (data.error) {
      spotifyData.errors.playlists[id] = data.error;
      failedPlaylists++;
    }
    
  }

  // Save data to files
  const dataDir = join(__dirname, 'data');
  console.log('\n=== Saving Generated Data ===');
  console.log('Target directory:', dataDir);

  try {
    // Save Spotify data
    const spotifyStats = {
      tracks: Object.keys(spotifyData.tracks).length,
      playlists: Object.keys(spotifyData.playlists).length,
      trackErrors: Object.keys(spotifyData.errors.tracks).length,
      playlistErrors: Object.keys(spotifyData.errors.playlists).length
    };
    
    writeFileSync(
      join(dataDir, 'spotify.json'),
      JSON.stringify(spotifyData, null, 2)
    );
    console.log('✓ Spotify data saved:', spotifyStats);

    // Save Genius data
    const geniusStats = {
      byId: Object.keys(geniusData.byId).length,
      byQuery: Object.keys(geniusData.byQuery).length
    };
    
    writeFileSync(
      join(dataDir, 'genius.json'),
      JSON.stringify(geniusData, null, 2)
    );
    console.log('✓ Genius data saved:', geniusStats);

    // Save Lyrics data
    const lyricsStats = {
      songs: Object.keys(lyricsData).length
    };
    
    writeFileSync(
      join(dataDir, 'lyrics.json'),
      JSON.stringify(lyricsData, null, 2)
    );
    console.log('✓ Lyrics data saved:', lyricsStats);

    // Print summary
    console.log('\n=== Generation Summary ===');
    console.log('Songs:', {
      total: songEntries.length,
      successful: successfulSongs,
      failed: failedSongs,
      details: songResults.map(r => `${r.id}: ${r.success ? 'success' : 'failed'}`)
    });
    console.log('Playlists:', {
      total: playlistEntries.length,
      successful: successfulPlaylists,
      failed: failedPlaylists
    });

    if (failedSongs > 0 || failedPlaylists > 0) {
      console.warn('\n⚠️  Warning: Some items failed to generate');
      console.warn('Please check the logs above for error details');
    }

  } catch (error) {
    console.error('\n✗ Error saving data files:', error);
    throw error;
  }

  console.log('\n=== Fixture Generation Complete ===\n');
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

export { generateFixtures, generatePlaylistData,generateSongData }; 