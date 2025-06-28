import { GeniusClientImpl } from '../genius';
import { GeniusApiError } from '@/app/api/lib/errors/clients/genius';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import { integration_validator } from '@/app/api/lib/test/validators';
import { env } from '@/app/api/lib/env';
import { TEST_IDS, getErrorCaseKeyById, TRACK_KEYS } from '@/app/api/lib/test/constants';

describe('GeniusClient', () => {
  let client: GeniusClientImpl;

  beforeEach(async () => {
    await setupIntegrationTest();
    client = new GeniusClientImpl(env.GENIUS_ACCESS_TOKEN);
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use provided access token', () => {
      const token = env.GENIUS_ACCESS_TOKEN;
      const customClient = new GeniusClientImpl(token);
      // Test that the client was created with the token (indirectly)
      expect(customClient).toBeInstanceOf(GeniusClientImpl);
    });
  });

  describe('search', () => {
    it('should return search results for valid query', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const results = await client.search(key);
      try {
        integration_validator.genius_client.search(key, results);
      } catch (error) {
        console.log('Search validation failed. Debug info:');
        console.log('Key:', key);
        console.log('Results:', JSON.stringify(results, null, 2));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should not return main artist/title for API_FAILURE', async () => {
      const key = 'API_FAILURE';
      const response = await client.search(key);
      const hits = response.response.hits;
      expect(hits.length).toBeGreaterThan(0); // Genius always returns hits
      const containsMainArtist = hits.some(hit => hit.result && hit.result.primary_artist && hit.result.primary_artist.name === 'Miley Cyrus');
      expect(containsMainArtist).toBe(false);
    });

    it('should not return main artist/title for NOT_FOUND track', async () => {
      const key = getErrorCaseKeyById(TEST_IDS.SPOTIFY.ERROR_CASES.NOT_FOUND);
      if (!key) throw new Error('Key for NOT_FOUND error case is undefined');
      const response = await client.search(key);
      const hits = response.response.hits;
      expect(hits.length).toBeGreaterThan(0);
      const containsMainArtist = hits.some(hit => hit.result && hit.result.primary_artist && hit.result.primary_artist.name === 'Miley Cyrus');
      expect(containsMainArtist).toBe(false);
      // For lyrics fetch, expect error for non-URL
      await expect(client.fetchLyricsPage(key)).rejects.toThrow(GeniusApiError);
    });

    it('should not return main artist/title for INVALID_FORMAT track', async () => {
      const key = getErrorCaseKeyById(TEST_IDS.SPOTIFY.ERROR_CASES.INVALID_FORMAT);
      if (!key) throw new Error('Key for INVALID_FORMAT error case is undefined');
      const response = await client.search(key);
      const hits = response.response.hits;
      expect(hits.length).toBeGreaterThan(0);
      const containsMainArtist = hits.some(hit => hit.result && hit.result.primary_artist && hit.result.primary_artist.name === 'Miley Cyrus');
      expect(containsMainArtist).toBe(false);
      await expect(client.fetchLyricsPage(key)).rejects.toThrow(GeniusApiError);
    });
  });

  describe('fetchLyricsPage', () => {
    it('should return lyrics page HTML for valid URL', async () => {
      const url = 'https://genius.com/Miley-cyrus-party-in-the-usa-lyrics';
      const html = await client.fetchLyricsPage(url);
      const expectedLyrics = 'Party in the U.S.A.';
      expect(html).toContain(expectedLyrics);
    });

    it('should throw GeniusApiError for invalid URL', async () => {
      await expect(client.fetchLyricsPage('')).rejects.toThrow(GeniusApiError);
      await expect(client.fetchLyricsPage('invalid_url')).rejects.toThrow(GeniusApiError);
      await expect(client.fetchLyricsPage('PARTY_IN_THE_USA')).rejects.toThrow(GeniusApiError);
    });
  });

  describe('getLyrics', () => {
    it('should return lyrics text for valid URL', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const searchResults = await client.search(key);
      
      const firstHit = searchResults.response.hits[0];
      if (!firstHit) {
        throw new Error('No search results found');
      }
      const url = firstHit.result.url;
      if (!url) {
        throw new Error('No URL found in search result');
      }
      
      const lyrics = await client.getLyrics(url);
      expect(lyrics).toBeDefined();
      expect(lyrics.length).toBeGreaterThan(0);
      expect(lyrics).toContain('yeah');  // Common word in "Party in the USA"
    });
  });
});