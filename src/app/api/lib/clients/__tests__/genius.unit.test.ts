import { describe, expect, it } from '@jest/globals';
import { GeniusClientImpl } from '../genius';
import { setupUnitTest, cleanupUnitTest } from '@/app/api/lib/test/env/unit';
import type { UnitTestContext } from '@/app/api/lib/test/env/unit';

describe('GeniusClient', () => {
  let client: GeniusClientImpl;
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
    client = new GeniusClientImpl('test-token', context.mockGeniusClient);
  });

  afterEach(() => {
    cleanupUnitTest();
    jest.restoreAllMocks();
  });

  describe('search', () => {
    it('should return search results for a valid query', async () => {
      const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = context.fixtures.spotify.getTrack.get(id);
      const query = context.fixtures.genius.getSearchQuery(track);
      const response = await client.search(query);
      context.validator.genius_client.search(response, query);
      expect(context.mockGeniusClient.search).toHaveBeenCalledWith(query);
    });

    it('should handle empty search results', async () => {
      const query = context.constants.ids.GENIUS.QUERIES.NO_RESULTS;
      const response = await client.search(query);
      expect(response.response.hits).toHaveLength(0);
      expect(context.mockGeniusClient.search).toHaveBeenCalledWith(query);
    });
  });

  describe('fetchLyricsPage', () => {
    it('should return lyrics page HTML for a valid URL', async () => {
      const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = context.fixtures.spotify.getTrack.get(id);
      const query = context.fixtures.genius.getSearchQuery(track);
      const searchResults = await client.search(query);
      const firstHit = searchResults.response.hits[0];
      if (!firstHit) {
        throw new Error('No search results found');
      }
      const url = firstHit.result.url;
      if (!url) {
        throw new Error('No URL found in search result');
      }
      const lyrics = await client.fetchLyricsPage(url);
      context.validator.genius_client.lyrics(lyrics, url);
      expect(context.mockGeniusClient.fetchLyricsPage).toHaveBeenCalledWith(url);
    });

    it('should handle missing lyrics', async () => {
      const url = context.constants.ids.GENIUS.URLS.NO_LYRICS;
      context.mockGeniusClient.fetchLyricsPage.mockRejectedValueOnce(new Error('Lyrics not found'));
      await expect(client.fetchLyricsPage(url)).rejects.toThrow();
      expect(context.mockGeniusClient.fetchLyricsPage).toHaveBeenCalledWith(url);
    });
  });
}); 