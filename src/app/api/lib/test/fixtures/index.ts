import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse, GeniusResult, MaskedLyrics } from '@/app/types';
import { TEST_IDS } from '../constants';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createMaskedLyricsService } from '../../services/masked-lyrics';
import { extractLyricsFromHtml } from '../../services/lyrics';

// Extended type for GeniusResult with artist property
interface GeniusResultWithArtist extends GeniusResult {
  artist: string;
}

// All fixture access is by constant key only. No mapping helpers needed.

export interface SpotifyFixtures {
  tracks: { [key: string]: Track };
  search: { 
    [key: string]: { 
      tracks?: { items: Track[] },
      playlists?: { items: SimplifiedPlaylist[] }
    } 
  };
  playlists: { [key: string]: { name: string; tracks: { items: { track: Track }[] } } };
}

export interface GeniusFixtures {
  search: { [key: string]: GeniusSearchResponse };
  lyrics: { [key: string]: string };
}

// Helper to load JSON fixture
function loadJsonFixture<T>(service: string, type: string, id: string): T {
  try {
    const filePath = join(process.cwd(), 'src/app/api/lib/test/fixtures/data', service, type, `${id}.json`);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load JSON fixture: ${service}/${type}/${id}`, error);
    throw new Error(`Failed to load ${service}/${type}/${id} fixture: ${error}`);
  }
}

// Helper to load HTML fixture
function loadHtmlFixture(service: string, type: string, id: string): string {
  try {
    const filePath = join(process.cwd(), 'src/app/api/lib/test/fixtures/data', service, type, `${id}.html`);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load HTML fixture: ${service}/${type}/${id}`, error);
    throw new Error(`Failed to load ${service}/${type}/${id} fixture: ${error}`);
  }
}

const WITH_LYRICS_TRACKS = TEST_IDS.SPOTIFY.TRACKS.WITH_LYRICS;
const INSTRUMENTAL_TRACKS = TEST_IDS.SPOTIFY.TRACKS.INSTRUMENTAL;
const ERROR_CASES = TEST_IDS.SPOTIFY.ERROR_CASES;

// Only load normal fixtures for WITH_LYRICS and INSTRUMENTAL
const SPOTIFY_TRACK_FIXTURES = Object.entries({ ...WITH_LYRICS_TRACKS, ...INSTRUMENTAL_TRACKS }).reduce((acc, [key]) => {
  try {
    acc[key] = loadJsonFixture<Track>('spotify', 'tracks', key);
  } catch (error) {
    console.warn(`Failed to load track fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['tracks']);

const SPOTIFY_SEARCH_FIXTURES = Object.entries({ ...WITH_LYRICS_TRACKS, ...INSTRUMENTAL_TRACKS }).reduce((acc, [key]) => {
  try {
    const searchData = loadJsonFixture<{ tracks: { items: Track[] } }>('spotify', 'search', key);
    acc[key] = searchData;
  } catch (error) {
    console.warn(`Failed to load search fixture for track ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['search']);

const GENIUS_SEARCH_FIXTURES = Object.entries({ ...WITH_LYRICS_TRACKS, ...INSTRUMENTAL_TRACKS }).reduce((acc, [key]) => {
  try {
    const searchData = loadJsonFixture<GeniusSearchResponse>('genius', 'search', key);
    // Add artist property to each hit result for consistency with extractGeniusData
    if (searchData.response.hits.length > 0) {
      searchData.response.hits.forEach(hit => {
        if (hit.result && !('artist' in hit.result)) {
          (hit.result as GeniusResultWithArtist).artist = hit.result.primary_artist?.name || '';
        }
      });
    }
    acc[key] = searchData;
  } catch (error) {
    console.warn(`Failed to load Genius search fixture for track ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['search']);

const GENIUS_LYRICS_FIXTURES = Object.entries({ ...WITH_LYRICS_TRACKS, ...INSTRUMENTAL_TRACKS }).reduce((acc, [key]) => {
  try {
    acc[key] = loadHtmlFixture('genius', 'lyrics', key);
  } catch (error) {
    console.warn(`Failed to load lyrics fixture for track ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['lyrics']);

// For error cases, only load error fixtures
const SPOTIFY_ERROR_TRACK_FIXTURES = Object.entries(ERROR_CASES).reduce((acc, [key]) => {
  try {
    acc[key] = loadJsonFixture('spotify', 'tracks', key);
  } catch (error) {
    console.warn(`Failed to load error track fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['tracks']);

const SPOTIFY_ERROR_SEARCH_FIXTURES = Object.entries(ERROR_CASES).reduce((acc, [key]) => {
  try {
    acc[key] = loadJsonFixture('spotify', 'search', key);
  } catch (error) {
    console.warn(`Failed to load error search fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['search']);

const GENIUS_ERROR_SEARCH_FIXTURES = Object.entries(ERROR_CASES).reduce((acc, [key]) => {
  try {
    acc[key] = loadJsonFixture('genius', 'search', key);
  } catch (error) {
    console.warn(`Failed to load error search fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['search']);

const GENIUS_ERROR_LYRICS_FIXTURES = Object.entries(ERROR_CASES).reduce((acc, [key]) => {
  try {
    acc[key] = loadHtmlFixture('genius', 'lyrics', key);
  } catch (error) {
    console.warn(`Failed to load error lyrics fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['lyrics']);

// Build playlist fixtures from captured data
const SPOTIFY_PLAYLIST_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).reduce((acc, [key]) => {
  try {
    acc[key] = loadJsonFixture('spotify', 'playlists', key);
  } catch (error) {
    console.warn(`Failed to load playlist fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['playlists']);

// Load playlist search fixtures from captured data
const SPOTIFY_PLAYLIST_SEARCH_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).reduce((acc, [key]) => {
  try {
    const searchData = loadJsonFixture<{ playlists: { items: SimplifiedPlaylist[] } }>('spotify', 'search', key);
    acc[key] = searchData;
  } catch (error) {
    console.warn(`Failed to load playlist search fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['search']);

// Merge all fixtures
const SPOTIFY_FIXTURES: SpotifyFixtures = {
  tracks: { ...SPOTIFY_TRACK_FIXTURES, ...SPOTIFY_ERROR_TRACK_FIXTURES },
  search: { ...SPOTIFY_SEARCH_FIXTURES, ...SPOTIFY_ERROR_SEARCH_FIXTURES, ...SPOTIFY_PLAYLIST_SEARCH_FIXTURES },
  playlists: SPOTIFY_PLAYLIST_FIXTURES
};

// Also load Genius search fixtures for special query keys (e.g., NO_RESULTS)
const GENIUS_QUERY_SEARCH_FIXTURES = Object.keys(TEST_IDS.GENIUS.QUERIES).reduce((acc, key) => {
  try {
    acc[key] = loadJsonFixture('genius', 'search', key);
  } catch (error) {
    console.warn(`Failed to load Genius search fixture for query key ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['search']);

// Merge all Genius search fixtures
const GENIUS_FIXTURES: GeniusFixtures = {
  search: { ...GENIUS_SEARCH_FIXTURES, ...GENIUS_ERROR_SEARCH_FIXTURES, ...GENIUS_QUERY_SEARCH_FIXTURES },
  lyrics: { ...GENIUS_LYRICS_FIXTURES, ...GENIUS_ERROR_LYRICS_FIXTURES }
};

// Generate maskedLyrics for each WITH_LYRICS_TRACKS entry
const GENIUS_MASKED_LYRICS_FIXTURES = Object.entries(WITH_LYRICS_TRACKS).reduce((acc, [key]) => {
  try {
    const track = SPOTIFY_TRACK_FIXTURES[key];
    const lyricsHtml = GENIUS_LYRICS_FIXTURES[key];
    if (track && lyricsHtml) {
      const lyrics = extractLyricsFromHtml(lyricsHtml);
      acc[key] = createMaskedLyricsService().create(
        track.name,
        track.artists[0].name,
        lyrics
      );
    }
  } catch (error) {
    console.warn(`Failed to generate maskedLyrics for ${key}: ${error}`);
  }
  return acc;
}, {} as Record<string, MaskedLyrics>);

// NEW: Direct key-based fixture access. Use only key constants for lookups.
export const fixtures = {
  spotify: {
    tracks: SPOTIFY_FIXTURES.tracks,
    search: SPOTIFY_FIXTURES.search,
    playlists: SPOTIFY_FIXTURES.playlists,
  },
  genius: {
    search: GENIUS_FIXTURES.search,
    lyrics: GENIUS_FIXTURES.lyrics,
    maskedLyrics: GENIUS_MASKED_LYRICS_FIXTURES,
  },
}; 