import type { GeniusSearchResponse } from '@/app/types';
import { fixtures } from '../../fixtures';
import { getExpectedSongMetadata } from '../../utils/genius';
import { TRACK_KEYS } from '../../constants';
import { extractLyricsFromHtml } from '../../../services/lyrics';

export interface LyricsMetadata {
  title: string;
  artist: string;
  album: string | null;
  release_date: string | null;
  lyrics_state: string;
  lyrics_placeholder: string;
}

export const genius_client = {
  search: (response: GeniusSearchResponse, key: string) => {
    expect(response).toBeDefined();
    const fixture = fixtures.genius.search[key];
    expect(fixture).toBeDefined();
    
    // Validate response structure
    expect(response.meta).toBeDefined();
    expect(response.meta.status).toBe(200);
    expect(response.response).toBeDefined();
    expect(Array.isArray(response.response.hits)).toBe(true);
    
    // Check if fixture has empty hits
    const expectedHits = fixture?.response?.hits || [];
    const actualHits = response?.response?.hits || [];
    
    if (expectedHits.length === 0) {
      // If the fixture has no hits, just check the response has no hits
      expect(actualHits.length).toBe(0);
      return true;
    }
    
    // For fixtures with hits, expect at least one hit
    expect(actualHits.length).toBeGreaterThan(0);

    // Validate each hit has the required structure
    response.response.hits.forEach(hit => {
      expect(hit.result).toBeDefined();
      expect(typeof hit.result.id).toBe('number');
      expect(typeof hit.result.title).toBe('string');
      expect(typeof hit.result.url).toBe('string');
      expect(hit.result.primary_artist).toBeDefined();
      expect(hit.result.primary_artist?.name).toBeDefined();
      expect(typeof hit.result.primary_artist?.name).toBe('string');
    });

    // Compare with fixture
    const mainResult = response.response.hits[0].result;
    const fixtureResult = fixture.response.hits[0].result;
    expect(mainResult.title).toBe(fixtureResult.title);
    expect(mainResult.primary_artist?.name).toBe(fixtureResult.primary_artist?.name);

    return true;
  },

  lyrics: (content: string, key: string) => {
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    
    // Extract expected lyrics from fixture HTML
    const fixtureHtml = fixtures.genius.lyrics[key];
    expect(fixtureHtml).toBeDefined();
    const expectedLyrics = extractLyricsFromHtml(fixtureHtml);
    expect(expectedLyrics).toBeDefined();
    expect(expectedLyrics.length).toBeGreaterThan(0);
    
    // Compare actual lyrics to expected extracted lyrics
    expect(content).toBe(expectedLyrics);
    
    // Get expected metadata for this track key (cast to correct type)
    const metadata = getExpectedSongMetadata(key as keyof typeof TRACK_KEYS);
    
    if (metadata.hasLyrics && metadata.title) {
      // Check that lyrics contain some reference to the song title
      const titleWords = metadata.title.toLowerCase().split(/\s+/);
      const contentLower = content.toLowerCase();
      
      // At least one significant word from the title should appear in lyrics
      const hasRelevantContent = titleWords.some(word => 
        word.length > 2 && contentLower.includes(word)
      );
      
      // This is flexible - not all songs will have the exact title in lyrics
      if (!hasRelevantContent && !contentLower.includes('licensing')) {
        console.warn(`No title words found in lyrics for ${key}, but this may be normal`);
      }
    }
    
    // Should not contain HTML tags
    expect(content).not.toMatch(/<[^>]*>/);
    expect(content).not.toContain('class=');
    expect(content).not.toContain('data-');
    
    return content;
  }
}; 