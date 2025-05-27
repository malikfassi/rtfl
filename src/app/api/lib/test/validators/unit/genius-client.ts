import type { GeniusSearchResponse } from '../../../types/genius';
import { fixtures } from '../../fixtures';

export interface LyricsMetadata {
  title: string;
  artist: string;
  album: string | null;
  release_date: string | null;
  lyrics_state: string;
  lyrics_placeholder: string;
}

export const genius_client = {
  search: (response: GeniusSearchResponse, query: string) => {
    expect(response).toBeDefined();
    const fixture = fixtures.genius.search.get(query);
    expect(fixture).toBeDefined();
    
    // Validate response structure
    expect(response.meta).toBeDefined();
    expect(response.meta.status).toBe(200);
    expect(response.response).toBeDefined();
    expect(Array.isArray(response.response.hits)).toBe(true);
    expect(response.response.hits.length).toBeGreaterThan(0);

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

  lyrics: (content: string, url: string) => {
    // Compare with fixture
    const fixture = fixtures.genius.lyrics.get(url);
    expect(content).toEqual(fixture);
    return content;
  }
}; 