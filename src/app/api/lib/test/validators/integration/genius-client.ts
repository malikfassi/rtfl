import { GeniusSearchResponse } from '../../../types/genius';
import { fixtures } from '../../fixtures';
import { TEST_IDS } from '../../constants';

export const geniusValidator = {
  search: (query: string, response: GeniusSearchResponse) => {
    // For known track queries, validate against fixtures
    for (const [key, uri] of Object.entries(TEST_IDS.SPOTIFY.TRACKS)) {
      const spotifyFixture = fixtures.spotify.getTrack.get(uri);
      const expectedQuery = `${spotifyFixture.name} ${spotifyFixture.artists[0].name}`;
      
      if (query === expectedQuery) {
        const fixture = fixtures.genius.search.get(query);
        expect(response).toEqual(fixture);
        return;
      }
    }

    // Handle special case for no results
    if (query === TEST_IDS.GENIUS.QUERIES.NO_RESULTS) {
      expect(response.response.hits).toHaveLength(0);
      return;
    }

    throw new Error(`No fixture found for query: ${query}`);
  },

  lyrics: (url: string, content: string) => {
    // For known URLs, validate against fixtures
    if (url === TEST_IDS.GENIUS.URLS.NO_LYRICS) {
      expect(content).toBe('');
      return;
    }

    const fixture = fixtures.genius.lyrics.get(url);
    expect(content).toEqual(fixture);
  }
}; 