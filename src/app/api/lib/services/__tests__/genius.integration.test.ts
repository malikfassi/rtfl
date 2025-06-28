import { createGeniusService } from '../genius';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import { ValidationError } from '@/app/api/lib/errors/base';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS, TEST_IDS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { GeniusClientImpl } from '@/app/api/lib/clients/genius';

describe('GeniusService Integration', () => {
  let geniusService: ReturnType<typeof createGeniusService>;

  beforeEach(async () => {
    await setupIntegrationTest();
    // Use the real GeniusClientImpl with env.test values
    const realClient = new GeniusClientImpl(process.env.GENIUS_ACCESS_TOKEN);
    geniusService = createGeniusService(realClient);
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('search', () => {
    it('should return search results for valid query', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const query = key;
      const response = await geniusService.search(query);
      integration_validator.genius_service.search(key, response);
    });

    it('should throw NoMatchingLyricsError for query with no results', async () => {
      const query = TEST_IDS.GENIUS.QUERIES.NO_RESULTS;
      await expect(geniusService.search(query))
        .rejects
        .toThrow(NoMatchingLyricsError);
    });

    it('should throw ValidationError for empty search query', async () => {
      await expect(geniusService.search(''))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only search query', async () => {
      await expect(geniusService.search('   '))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('findMatch', () => {
    it('should find exact match for popular song', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const searchFixture = fixtures.genius.search[key];
      const firstHit = searchFixture.response.hits[0];
      expect(firstHit.result.primary_artist).toBeDefined();
      const match = await geniusService.findMatch(firstHit.result.title, firstHit.result.primary_artist!.name);
      integration_validator.genius_service.findMatch(key, match);
    });

    it('should find match for French song', async () => {
      const key = TRACK_KEYS.LA_VIE_EN_ROSE;
      const searchFixture = fixtures.genius.search[key];
      const firstHit = searchFixture.response.hits[0];
      expect(firstHit.result.primary_artist).toBeDefined();
      const match = await geniusService.findMatch(firstHit.result.title, firstHit.result.primary_artist!.name);
      integration_validator.genius_service.findMatch(key, match);
    });

    it('should throw NoMatchingLyricsError for completely unknown song', async () => {
      const query = TEST_IDS.GENIUS.QUERIES.NO_RESULTS;
      await expect(geniusService.findMatch(query, query))
        .rejects
        .toThrow(NoMatchingLyricsError);
    });

    it('should handle partial matches gracefully', async () => {
      const key = TRACK_KEYS.BEAT_IT;
      const searchFixture = fixtures.genius.search[key];
      const firstHit = searchFixture.response.hits[0];
      expect(firstHit.result.primary_artist).toBeDefined();
      const match = await geniusService.findMatch(firstHit.result.title, firstHit.result.primary_artist!.name);
      integration_validator.genius_service.findMatch(key, match);
    });
  });
}); 