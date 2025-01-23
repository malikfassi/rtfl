import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
console.log('Loading environment variables...');
config();
console.log('Environment variables loaded');

/**
 * Test Case Generator
 * 
 * This module generates test data directly from Spotify and Genius APIs.
 * The data is saved as JSON files and used by the test case wrapper.
 */

import { SpotifyClientImpl } from '@/lib/clients/spotify';
import { GeniusClientImpl } from '@/lib/clients/genius';
import { SONG_IDS, PLAYLIST_IDS, type SpotifyId, type PlaylistId } from './spotify_ids';
import type { Track } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '@/types/genius';

// Load environment variables
console.log('Checking environment variables...');
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

console.log('Environment variables status:');
console.log('- SPOTIFY_CLIENT_ID:', SPOTIFY_CLIENT_ID ? 'Present' : 'Missing');
console.log('- SPOTIFY_CLIENT_SECRET:', SPOTIFY_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('- GENIUS_ACCESS_TOKEN:', GENIUS_ACCESS_TOKEN ? 'Present' : 'Missing');

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !GENIUS_ACCESS_TOKEN) {
  throw new Error('Missing required environment variables');
}

// Initialize clients
console.log('Initializing API clients...');
const spotify = new SpotifyClientImpl(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET);
const genius = new GeniusClientImpl(GENIUS_ACCESS_TOKEN);
console.log('API clients initialized');

interface SpotifyData {
  tracks: Partial<Record<SpotifyId, Track>>;
  playlistTracks: Partial<Record<PlaylistId, Track[]>>;
  errors: {
    tracks: Partial<Record<SpotifyId, { status: number; message: string }>>;
    playlists: Partial<Record<PlaylistId, { status: number; message: string }>>;
  };
}

interface GeniusData {
  byId: Partial<Record<SpotifyId, GeniusSearchResponse>>;
  byQuery: Record<string, GeniusSearchResponse>;
}

type LyricsData = Partial<Record<SpotifyId, string>>;

/**
 * Generate data for a song
 */
async function generateSongData(id: SpotifyId): Promise<{
  track?: Track;
  geniusSearch?: GeniusSearchResponse;
  lyrics?: string;
  error?: { status: number; message: string };
}> {
  console.log(`Generating data for song ${id}...`);
  try {
    // Fetch data from APIs
    console.log('- Fetching Spotify track data...');
    const track = await spotify.getTrack(id);
    console.log('- Spotify track data fetched');

    console.log('- Searching Genius...');
    const searchResponse = await genius.search(`${track.name} ${track.artists[0].name}`);
    console.log('- Genius search complete');

    console.log('- Fetching lyrics...');
    const lyrics = await genius.getLyrics(searchResponse.response.hits[0].result.url);
    console.log('- Lyrics fetched');

    if (!lyrics) {
      throw new Error('No lyrics found');
    }

    console.log('Data generated successfully');
    return { track, geniusSearch: searchResponse, lyrics };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
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
  tracks?: Track[];
  error?: { status: number; message: string };
}> {
  console.log(`Generating data for playlist ${id}...`);
  try {
    // Get playlist tracks
    console.log('- Fetching playlist tracks...');
    const tracks = await spotify.getPlaylistTracks(id);
    console.log(`- Found ${tracks.length} tracks`);
    
    if (!tracks.length) {
      throw new Error('No tracks found in playlist');
    }

    console.log('Data generated successfully');
    return { tracks };
  } catch (error) {
    const err = error as { status?: number; message?: string };
    return {
      error: { 
        status: err.status || 500,
        message: err.message || 'Unknown error'
      }
    };
  }
}

/**
 * Main function to generate all test data
 */
async function generateFixtures() {
  console.log('Starting fixture generation...');
  console.log('Environment setup successful');

  // Initialize data structures
  const spotifyData: SpotifyData = {
    tracks: {},
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
  console.log('\nGenerating song data...');
  console.log('Songs to process:', Object.keys(SONG_IDS).length);
  await Promise.all(
    Object.entries(SONG_IDS).map(async ([key, id]) => {
      console.log(`Processing song: ${key}`);
      const data = await generateSongData(id);
      
      if (data.track) {
        spotifyData.tracks[id] = data.track;
      }
      if (data.geniusSearch) {
        geniusData.byId[id] = data.geniusSearch;
      }
      if (data.lyrics) {
        lyricsData[id] = data.lyrics;
      }
      if (data.error) {
        spotifyData.errors.tracks[id] = data.error;
      }
    })
  );
  console.log('Song data generated');

  // Generate playlist data
  console.log('\nGenerating playlist data...');
  console.log('Playlists to process:', Object.keys(PLAYLIST_IDS).length);
  await Promise.all(
    Object.entries(PLAYLIST_IDS).map(async ([key, id]) => {
      console.log(`Processing playlist: ${key}`);
      const data = await generatePlaylistData(id);
      
      if (data.tracks) {
        spotifyData.playlistTracks[id] = data.tracks;
      }
      if (data.error) {
        spotifyData.errors.playlists[id] = data.error;
      }
    })
  );
  console.log('Playlist data generated');

  // Save data to files
  const dataDir = join(__dirname, 'data');
  console.log('\nSaving data to:', dataDir);

  writeFileSync(
    join(dataDir, 'spotify.json'),
    JSON.stringify(spotifyData, null, 2)
  );
  writeFileSync(
    join(dataDir, 'genius.json'),
    JSON.stringify(geniusData, null, 2)
  );
  writeFileSync(
    join(dataDir, 'lyrics.json'),
    JSON.stringify(lyricsData, null, 2)
  );

  console.log('Data saved successfully');
}

// Run if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('Starting fixture generation script...');
  generateFixtures().catch(error => {
    console.error('\nError generating fixtures:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  });
}

export { generateFixtures, generateSongData, generatePlaylistData }; 