import { describe, expect, it } from '@jest/globals';
import { GeniusClientImpl } from '../genius';
import { setupUnitTest, cleanupUnitTest } from '@/app/api/lib/test/env/unit';
import type { UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TEST_IDS, TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';

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
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const response = await client.search(key);
      
      // Use validator which checks structure and compares against fixture
      context.validator.genius_client.search(response, key);
      
      expect(context.mockGeniusClient.search).toHaveBeenCalledWith(key);
    });

    it('should handle empty search results', async () => {
      const key = 'NO_RESULTS';
      const response = await client.search(key);
      
      // Use validator which checks structure and compares against fixture
      context.validator.genius_client.search(response, key);
      
      expect(context.mockGeniusClient.search).toHaveBeenCalledWith(key);
    });

    it('should not return main artist/title for NOT_FOUND track', async () => {
      const key = 'NOT_FOUND';
      const response = await client.search(key);
      
      // Use validator which checks structure and compares against fixture
      context.validator.genius_client.search(response, key);
      
      const hits = response.response.hits;
      const containsMainArtist = hits.some(hit => hit.result && hit.result.primary_artist && hit.result.primary_artist.name === 'Miley Cyrus');
      expect(containsMainArtist).toBe(false);
      await expect(client.fetchLyricsPage(key)).rejects.toThrow();
    });

    it('should throw for invalid lyrics URL', async () => {
      // This covers the INVALID_FORMAT case for fetchLyricsPage
      const id = TEST_IDS.SPOTIFY.ERROR_CASES.INVALID_FORMAT;
      await expect(client.fetchLyricsPage(id)).rejects.toThrow();
    });
  });

  describe('fetchLyricsPage', () => {
    it('should return lyrics page HTML for a valid URL', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const searchFixture = fixtures.genius.search[key];
      const firstHit = searchFixture.response.hits[0];
      if (!firstHit) {
        throw new Error('No search results found in fixture');
      }
      const url = firstHit.result.url;
      if (!url) {
        throw new Error('No URL found in search result fixture');
      }
      const html = await client.fetchLyricsPage(url);
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      // Should contain HTML tags
      expect(html).toMatch(/<[^>]+>/);
      // Should match the fixture lyrics
      const expectedLyrics = fixtures.genius.lyrics[key];
      expect(html).toBe(expectedLyrics);
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