import { GeniusClientImpl } from '../genius';
import { GeniusApiError } from '@/app/api/lib/errors/clients/genius';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import type { IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { integration_validator } from '@/app/api/lib/test/validators';
import { env } from '@/app/api/lib/env';

describe('GeniusClient', () => {
  let client: GeniusClientImpl;
  let context: IntegrationTestContext;

  beforeEach(async () => {
    context = await setupIntegrationTest();
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
      expect((customClient as any).accessToken).toBe(token);
    });
  });

  describe('search', () => {
    it('should return search results for valid query', async () => {
      const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = context.fixtures.spotify.getTrack.get(id);
      const query = context.fixtures.genius.getSearchQuery(track);
      const results = await client.search(query);
      try {
        integration_validator.genius_client.search(query, results);
      } catch (error) {
        console.log('Search validation failed. Debug info:');
        console.log('Query:', query);
        console.log('Results:', JSON.stringify(results, null, 2));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should throw GeniusApiError for no results', async () => {
      const query = context.constants.ids.GENIUS.QUERIES.NO_RESULTS;
      await expect(client.search(query)).rejects.toThrow(GeniusApiError);
    });

    it('should throw GeniusApiError for API failures', async () => {
      await expect(client.search('')).rejects.toThrow(GeniusApiError);
    });
  });

  describe('fetchLyricsPage', () => {
    it('should return lyrics page HTML for valid URL', async () => {
      const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = context.fixtures.spotify.getTrack.get(id);
      const query = `${track.name} ${track.artists[0].name}`.toLowerCase();
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
      try {
        integration_validator.genius_client.lyrics(lyrics, url);
      } catch (error) {
        console.log('Lyrics validation failed. Debug info:');
        console.log('URL:', url);
        console.log('Expected fixture path:', `genius/lyrics/${encodeURIComponent(url)}.html`);
        console.log('Actual lyrics length:', lyrics.length);
        console.log('First 500 chars of lyrics:', lyrics.substring(0, 500));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should throw GeniusApiError for invalid URL', async () => {
      await expect(client.fetchLyricsPage('')).rejects.toThrow(GeniusApiError);
    });

    it('should throw GeniusApiError for failed fetch', async () => {
      await expect(client.fetchLyricsPage('invalid_url')).rejects.toThrow(GeniusApiError);
    });
  });
});