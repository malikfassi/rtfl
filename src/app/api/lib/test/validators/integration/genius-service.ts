import type { GeniusSearchResponse, GeniusHit } from '@/app/types';
import { fixtures } from '../../fixtures';
import { TEST_IDS } from '../../constants';

export const geniusService = {
  search: (key: string, response: GeniusSearchResponse) => {
    expect(response).toBeDefined();
    expect(response).toHaveProperty('meta');
    expect(response.meta).toHaveProperty('status');
    expect(response.meta.status).toBe(200);
    expect(response).toHaveProperty('response');
    expect(response.response).toHaveProperty('hits');
    expect(Array.isArray(response.response.hits)).toBe(true);
    
    // Compare with fixture
    const fixture = fixtures.genius.search[key];
    
    // For no-results query, expect empty hits
    if (key === TEST_IDS.GENIUS.QUERIES.NO_RESULTS || !fixture) {
      expect(response.response.hits.length).toBe(0);
      return response;
    }
    
    // For successful searches, expect at least one hit
    expect(response.response.hits.length).toBeGreaterThan(0);
    
    // Check that response contains expected content from fixture
    const expectedHits = fixture.response.hits || [];
    const actualHits = response.response.hits || [];
    
    if (expectedHits.length > 0) {
      const expectedMain = expectedHits[0]?.result;
      const foundRelevant = actualHits.some(hit => {
        if (!hit.result) return false;
        const artistMatch = expectedMain?.primary_artist?.name && 
          hit.result.primary_artist?.name && 
          hit.result.primary_artist.name.toLowerCase().includes(expectedMain.primary_artist.name.toLowerCase());
        const titleMatch = expectedMain?.title && 
          hit.result.title && 
          hit.result.title.toLowerCase().includes(expectedMain.title.toLowerCase());
        return artistMatch || titleMatch;
      });
      expect(foundRelevant).toBe(true);
    }
    
    return response;
  },

  findMatch: (key: string, hit: GeniusHit) => {
    expect(hit).toBeDefined();
    expect(hit).toHaveProperty('result');
    expect(hit.result).toHaveProperty('title');
    expect(hit.result).toHaveProperty('primary_artist');
    expect(hit.result.primary_artist).toBeDefined();
    expect(hit.result.primary_artist).toHaveProperty('name');
    expect(hit.result).toHaveProperty('url');
    expect(typeof hit.result.url).toBe('string');
    expect(hit.result.url).toMatch(/^https?:\/\//);
    expect(hit.result.url).toContain('genius.com');
    
    // Compare with fixture
    const fixture = fixtures.genius.search[key];
    if (fixture && fixture.response.hits.length > 0) {
      const expectedMain = fixture.response.hits[0].result;
      
      // Check that the match is relevant to the fixture
      const artistMatch = expectedMain?.primary_artist?.name && 
        hit.result.primary_artist?.name && 
        hit.result.primary_artist.name.toLowerCase().includes(expectedMain.primary_artist.name.toLowerCase());
      const titleMatch = expectedMain?.title && 
        hit.result.title && 
        hit.result.title.toLowerCase().includes(expectedMain.title.toLowerCase());
      
      expect(artistMatch || titleMatch).toBe(true);
    }
    
    return hit;
  }
}; 