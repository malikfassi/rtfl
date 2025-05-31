import { GeniusService } from '../genius';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import { unit_validator } from '@/app/api/lib/test/validators';
import { GeniusMocks } from '@/app/api/lib/test/mocks';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { TRACK_KEYS, TEST_IDS } from '@/app/api/lib/test/constants';

describe('GeniusService Unit', () => {
  let service: GeniusService;

  beforeEach(() => {
    service = new GeniusService();
    // @ts-expect-error: override private
    service.geniusClient = GeniusMocks.createClient();
  });

  it('search returns valid GeniusSearchResponse', async () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const result = await service.search(key);
    unit_validator.genius_service.search(key, result);
    // Should match the fixture
    expect(result).toEqual(fixtures.genius.search[key]);
  });

  it('search throws NoMatchingLyricsError if no hits', async () => {
    const key = 'NO_RESULTS'; // Use a key in your fixtures that returns no hits
    // Add a dummy fixture if needed
    fixtures.genius.search[key] = { meta: { status: 200 }, response: { hits: [] } };
    await expect(service.search(key)).rejects.toThrow(NoMatchingLyricsError);
  });

  it('findMatch returns best match', async () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const searchFixture = fixtures.genius.search[key];
    const firstHit = searchFixture.response.hits[0];
    expect(firstHit.result.primary_artist).toBeDefined();
    const expectedQuery = `${firstHit.result.title} ${firstHit.result.primary_artist!.name}`;
    // @ts-expect-error: override private for test
    (service.geniusClient.search as jest.Mock).mockImplementationOnce(async (query: string) => {
      if (query === expectedQuery) return searchFixture;
      return undefined;
    });
    const result = await service.findMatch(firstHit.result.title, firstHit.result.primary_artist!.name);
    unit_validator.genius_service.findMatch(key, result);
    expect(result).toEqual(firstHit);
  });

  it('findMatch throws NoMatchingLyricsError if no match', async () => {
    const key = TEST_IDS.GENIUS.QUERIES.NO_RESULTS;
    const combinedKey = `${key} ${key}`;
    fixtures.genius.search[combinedKey] = { meta: { status: 200 }, response: { hits: [] } };
    await expect(service.findMatch(key, key)).rejects.toThrow(NoMatchingLyricsError);
  });
}); 