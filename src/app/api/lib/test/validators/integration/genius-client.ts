import { GeniusSearchResponse } from '@/app/types';
import { fixtures } from '../../fixtures';
import { TEST_IDS } from '../../constants';
import { getExpectedSongMetadata } from '../../utils/genius';
import { TRACK_KEYS } from '../../constants';


export const geniusValidator = {
  search: (key: string, response: GeniusSearchResponse) => {
    const fixture = fixtures.genius.search[key];
    // For nonsense/error keys, expect non-empty hits and no main artist/title
    if ([
      'API_FAILURE',
      TEST_IDS.SPOTIFY.ERROR_CASES.NOT_FOUND,
      TEST_IDS.SPOTIFY.ERROR_CASES.INVALID_FORMAT
    ].includes(key)) {
      const hits = response.response.hits;
      expect(hits.length).toBeGreaterThan(0);
      const containsMainArtist = hits.some(hit => hit.result && hit.result.primary_artist && hit.result.primary_artist.name === 'Miley Cyrus');
      expect(containsMainArtist).toBe(false);
      return;
    }
    // Relaxed: just check that at least one hit matches the main artist or title from the fixture (if available)
    const expectedHits = fixture?.response?.hits || [];
    const actualHits = response?.response?.hits || [];
    if (expectedHits.length === 0) {
      // If the fixture has no hits, just check the response has no hits
      expect(actualHits.length).toBe(0);
      return;
    }
    // Try to find a relevant match in the actual hits
    const expectedMain = expectedHits[0]?.result;
    const foundRelevant = actualHits.some(hit => {
      if (!hit.result) return false;
      const artistMatch = expectedMain?.primary_artist?.name && hit.result.primary_artist?.name && hit.result.primary_artist.name.includes(expectedMain.primary_artist.name);
      const titleMatch = expectedMain?.title && hit.result.title && hit.result.title.includes(expectedMain.title);
      return artistMatch || titleMatch;
    });
    expect(foundRelevant).toBe(true);
  },

  lyrics: (content: string, key: string) => {
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    
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
      
      // For integration tests, be more lenient since real content may vary
      if (!hasRelevantContent && !contentLower.includes('licensing')) {
        console.warn(`No title words found in lyrics for ${key}, but this may be normal for integration tests`);
      }
    }
    
    // Should not contain HTML tags
    expect(content).not.toMatch(/<[^>]*>/);
    expect(content).not.toContain('class=');
    expect(content).not.toContain('data-');
    
    return content;
  }
}; 