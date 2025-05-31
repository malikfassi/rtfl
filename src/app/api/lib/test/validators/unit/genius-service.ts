import type { GeniusSearchResponse, GeniusHit } from '../../../types/genius';
import { fixtures } from '../../fixtures';
import { TEST_IDS } from '../../constants';

export const geniusService = {
  search: (key: string, response: GeniusSearchResponse) => {
    expect(response).toBeDefined();
    expect(response).toHaveProperty('meta');
    expect(response).toHaveProperty('response');
    expect(response.response).toHaveProperty('hits');
    expect(Array.isArray(response.response.hits)).toBe(true);
    
    if (response.response.hits.length > 0) {
      const firstHit = response.response.hits[0];
      expect(firstHit).toHaveProperty('result');
      expect(firstHit.result).toHaveProperty('title');
      expect(firstHit.result).toHaveProperty('primary_artist');
    }
    
    // Compare with fixture
    const fixture = fixtures.genius.search[key];
    
    // For no-results query, expect empty hits
    if (key === TEST_IDS.GENIUS.QUERIES.NO_RESULTS || !fixture) {
      expect(response.response.hits.length).toBe(0);
      return response;
    }
    
    // For successful searches, expect exact match to fixture for unit tests
    expect(response).toEqual(fixture);
    
    return response;
  },

  findMatch: (key: string, hit: GeniusHit) => {
    expect(hit).toBeDefined();
    expect(hit).toHaveProperty('result');
    expect(hit.result).toHaveProperty('title');
    expect(hit.result).toHaveProperty('primary_artist');
    expect(hit.result).toHaveProperty('url');
    expect(typeof hit.result.url).toBe('string');
    expect(hit.result.url).toMatch(/^https?:\/\//);
    
    // Compare with fixture
    const fixture = fixtures.genius.search[key];
    if (fixture && fixture.response.hits.length > 0) {
      const expectedFirst = fixture.response.hits[0];
      expect(hit).toEqual(expectedFirst);
    }
    
    return hit;
  }
}; 