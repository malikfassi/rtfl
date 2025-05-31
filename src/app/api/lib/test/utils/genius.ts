import { fixtures } from '../fixtures';
import { TRACK_KEYS } from '../constants';

/**
 * Get the Genius song ID for a track key from fixture data
 */
export function getGeniusIdFromTrackKey(key: keyof typeof TRACK_KEYS): string | null {
  try {
    const geniusSearch = fixtures.genius.search[key];
    if (!geniusSearch?.response?.hits?.length) {
      return null;
    }
    
    const firstHit = geniusSearch.response.hits[0];
    return firstHit?.result?.id?.toString() || null;
  } catch (error) {
    console.warn(`Failed to get Genius ID for track key ${key}:`, error);
    return null;
  }
}

/**
 * Get the Genius song URL for a track key from fixture data (preferred for LyricsService)
 */
export function getGeniusUrlFromTrackKey(key: keyof typeof TRACK_KEYS): string | null {
  try {
    const geniusSearch = fixtures.genius.search[key];
    if (!geniusSearch?.response?.hits?.length) {
      return null;
    }
    
    const firstHit = geniusSearch.response.hits[0];
    return firstHit?.result?.url || null;
  } catch (error) {
    console.warn(`Failed to get Genius URL for track key ${key}:`, error);
    return null;
  }
}

/**
 * Get expected song metadata from fixture for validation
 */
export function getExpectedSongMetadata(key: keyof typeof TRACK_KEYS): {
  title?: string;
  artist?: string;
  hasLyrics: boolean;
} {
  try {
    const geniusSearch = fixtures.genius.search[key];
    if (!geniusSearch?.response?.hits?.length) {
      return { hasLyrics: false };
    }
    
    const firstHit = geniusSearch.response.hits[0];
    const result = firstHit?.result;
    
    return {
      title: result?.title,
      artist: result?.primary_artist?.name,
      hasLyrics: true
    };
  } catch (error) {
    console.warn(`Failed to get expected metadata for track key ${key}:`, error);
    return { hasLyrics: false };
  }
} 