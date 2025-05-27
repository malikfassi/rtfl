import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import type { GeniusSearchResponse } from '../../types/genius';
import { TEST_IDS } from '../constants';
import { readFileSync } from 'fs';
import { join } from 'path';
import { constructGeniusSearchQuery } from '../../utils/genius';
import { constructSpotifySearchQuery } from '../../utils/spotify';

// Helper to get ID from Spotify URI
const getId = (uri: string) => uri.split(':').pop()!;

// Helper to construct Genius search query from Spotify track
const getGeniusQuery = (track: Track) => {
  const normalizedTitle = track.name.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')                      // Normalize whitespace
    .trim();
  
  const normalizedArtist = track.artists[0].name.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')                      // Normalize whitespace
    .trim();
  
  return `${normalizedTitle} ${normalizedArtist}`;
};

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
    console.log(`Loading JSON fixture from: ${filePath}`);
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
    console.log(`Loading HTML fixture from: ${filePath}`);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load HTML fixture: ${service}/${type}/${id}`, error);
    throw new Error(`Failed to load ${service}/${type}/${id} fixture: ${error}`);
  }
}

// Load track fixtures first
const SPOTIFY_TRACK_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.TRACKS).reduce((acc, [key, uri]) => {
  try {
    acc[key] = loadJsonFixture<Track>('spotify', 'tracks', key);
  } catch (error) {
    console.warn(`Failed to load track fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['tracks']);

// Build search fixtures from captured data
const SPOTIFY_SEARCH_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.TRACKS).reduce((acc, [key, uri]) => {
  try {
    const searchData = loadJsonFixture<{ tracks: { items: Track[] } }>('spotify', 'search', key);
    acc[key] = searchData;
  } catch (error) {
    console.warn(`Failed to load search fixture for track ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['search']);

// Build playlist fixtures from captured data
const SPOTIFY_PLAYLIST_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).reduce((acc, [key, uri]) => {
  try {
    acc[key] = loadJsonFixture('spotify', 'playlists', key);
  } catch (error) {
    console.warn(`Failed to load playlist fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['playlists']);

// Load playlist search fixtures from captured data
const SPOTIFY_PLAYLIST_SEARCH_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).reduce((acc, [key, uri]) => {
  try {
    const searchData = loadJsonFixture<{ playlists: { items: SimplifiedPlaylist[] } }>('spotify', 'search', key);
    acc[key] = searchData;
  } catch (error) {
    console.warn(`Failed to load playlist search fixture for ${key}: ${error}`);
  }
  return acc;
}, {} as SpotifyFixtures['search']);

// Build Genius search fixtures from captured data
const GENIUS_SEARCH_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.TRACKS).reduce((acc, [key, uri]) => {
  try {
    const searchData = loadJsonFixture<GeniusSearchResponse>('genius', 'search', key);
    acc[key] = searchData;
  } catch (error) {
    console.warn(`Failed to load Genius search fixture for track ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['search']);

// Build Genius lyrics fixtures from captured data
const GENIUS_LYRICS_FIXTURES = Object.entries(TEST_IDS.SPOTIFY.TRACKS).reduce((acc, [key, uri]) => {
  try {
    acc[key] = loadHtmlFixture('genius', 'lyrics', key);
  } catch (error) {
    console.warn(`Failed to load lyrics fixture for track ${key}: ${error}`);
  }
  return acc;
}, {} as GeniusFixtures['lyrics']);

// Merge all search fixtures
const SPOTIFY_FIXTURES: SpotifyFixtures = {
  tracks: SPOTIFY_TRACK_FIXTURES,
  search: {
    ...SPOTIFY_SEARCH_FIXTURES,
    ...SPOTIFY_PLAYLIST_SEARCH_FIXTURES
  },
  playlists: SPOTIFY_PLAYLIST_FIXTURES
};

const GENIUS_FIXTURES: GeniusFixtures = {
  search: GENIUS_SEARCH_FIXTURES,
  lyrics: GENIUS_LYRICS_FIXTURES
};

// Helper to get fixture with error handling
const getFixture = <T>(obj: Record<string, T>, key: string, type: string): T => {
  console.log(`Getting fixture for ${type}: ${key}`);
  console.log(`Available keys:`, Object.keys(obj));
  
  const response = obj[key];
  if (!response) throw new Error(`No fixture found for ${type}: ${key}`);
  return response;
};

// Export typed fixtures
export const fixtures = {
  spotify: {
    getTrack: {
      get: (id: string) => {
        // Find the constant key for this track URI
        const [key] = Object.entries(TEST_IDS.SPOTIFY.TRACKS).find(([_, uri]) => uri === id) || [];
        if (!key) throw new Error(`No fixture found for track: ${id}`);
        return getFixture(SPOTIFY_FIXTURES.tracks, key, 'track');
      }
    },
    searchTracks: {
      get: (query: string) => {
        // Find the constant key for this search query
        const [key] = Object.entries(TEST_IDS.SPOTIFY.TRACKS).find(([k, uri]) => {
          const track = SPOTIFY_FIXTURES.tracks[k];
          return track && constructSpotifySearchQuery(track.name, track.artists[0].name) === query;
        }) || [];
        
        if (!key) {
          throw new Error(`No fixture found for search: ${query}`);
        }
        
        const result = getFixture(SPOTIFY_FIXTURES.search, key, 'search');
        return result.tracks?.items || [];
      }
    },
    searchPlaylists: {
      get: (query: string) => {
        // Find the constant key for this playlist search
        const [key] = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).find(([k, uri]) => {
          const playlist = SPOTIFY_FIXTURES.playlists[k];
          return playlist && playlist.name === query;
        }) || [];
        
        if (!key) {
          throw new Error(`No fixture found for playlist search: ${query}`);
        }
        
        return getFixture(SPOTIFY_FIXTURES.search, key, 'search');
      }
    },
    getPlaylist: {
      get: (id: string) => {
        // Find the constant key for this playlist URI
        const [key] = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).find(([_, uri]) => uri === id) || [];
        if (!key) throw new Error(`No fixture found for playlist: ${id}`);
        return getFixture(SPOTIFY_FIXTURES.playlists, key, 'playlist');
      }
    },
    getPlaylistTracks: {
      get: (id: string) => {
        // Find the constant key for this playlist URI
        const [key] = Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS).find(([_, uri]) => uri === id) || [];
        if (!key) throw new Error(`No fixture found for playlist: ${id}`);
        const playlist = getFixture(SPOTIFY_FIXTURES.playlists, key, 'playlist');
        return playlist.tracks.items.map(item => item.track);
      }
    }
  },
  genius: {
    search: {
      get: (query: string) => {
        // Find the constant key for this search query
        const [key] = Object.entries(TEST_IDS.SPOTIFY.TRACKS).find(([k, uri]) => {
          const track = SPOTIFY_FIXTURES.tracks[k];
          return track && constructGeniusSearchQuery(track.name, track.artists[0].name) === query;
        }) || [];
        
        if (!key) {
          throw new Error(`No fixture found for Genius search: ${query}`);
        }
        
        return getFixture(GENIUS_FIXTURES.search, key, 'search');
      }
    },
    lyrics: {
      get: (url: string) => {
        // Find the constant key for this lyrics URL
        const [key] = Object.entries(TEST_IDS.SPOTIFY.TRACKS).find(([k, uri]) => {
          const track = SPOTIFY_FIXTURES.tracks[k];
          const searchData = GENIUS_FIXTURES.search[k];
          return searchData?.response.hits[0]?.result?.url === url;
        }) || [];
        
        if (!key) {
          throw new Error(`No fixture found for Genius lyrics: ${url}`);
        }
        
        return getFixture(GENIUS_FIXTURES.lyrics, key, 'lyrics');
      }
    },
    getSearchQuery: (track: Track) => constructGeniusSearchQuery(track.name, track.artists[0].name)
  }
}; 