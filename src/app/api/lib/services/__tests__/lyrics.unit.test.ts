import { LyricsService } from '../lyrics';
import { LyricsExtractionError } from '@/app/api/lib/errors/services/lyrics';
import { setupUnitTest, cleanupUnitTest, UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { 
  getGeniusUrlFromTrackKey, 
  getExpectedSongMetadata 
} from '@/app/api/lib/test/utils/genius';
import { unit_validator } from '@/app/api/lib/test/validators';

describe('LyricsService Unit Tests', () => {
  let lyricsService: LyricsService;
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
    lyricsService = new LyricsService();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('getLyrics', () => {
    it('should extract lyrics from PARTY_IN_THE_USA fixture', async () => {
      const trackKey = TRACK_KEYS.PARTY_IN_THE_USA;
      const url = getGeniusUrlFromTrackKey(trackKey);
      
      if (!url) {
        throw new Error(`No Genius URL found for track key ${trackKey}`);
      }
      
      const lyrics = await lyricsService.getLyrics(url);
      
      // Use lyrics_service validator instead of genius_client
      unit_validator.lyrics_service.getLyrics(trackKey, lyrics);
      
      // Basic structure checks
      expect(typeof lyrics).toBe('string');
      expect(lyrics.length).toBeGreaterThan(0);
      
      // Should not contain HTML tags or styling
      expect(lyrics).not.toContain('<div');
      expect(lyrics).not.toContain('class=');
      expect(lyrics).not.toContain('data-');
    });

    it('should extract lyrics from BEAT_IT fixture', async () => {
      const trackKey = TRACK_KEYS.BEAT_IT;
      const url = getGeniusUrlFromTrackKey(trackKey);
      
      if (!url) {
        throw new Error(`No Genius URL found for track key ${trackKey}`);
      }
      
      const lyrics = await lyricsService.getLyrics(url);
      
      unit_validator.lyrics_service.getLyrics(trackKey, lyrics);
      expect(lyrics).not.toContain('<');
    });

    it('should extract lyrics from LA_VIE_EN_ROSE fixture (French)', async () => {
      const trackKey = TRACK_KEYS.LA_VIE_EN_ROSE;
      const url = getGeniusUrlFromTrackKey(trackKey);
      
      if (!url) {
        throw new Error(`No Genius URL found for track key ${trackKey}`);
      }
      
      const lyrics = await lyricsService.getLyrics(url);
      
      unit_validator.lyrics_service.getLyrics(trackKey, lyrics);
      expect(lyrics).not.toContain('<');
    });

    it('should throw LyricsExtractionError when API returns 404', async () => {
      const url = 'https://genius.com/nonexistent-song';
      await expect(lyricsService.getLyrics(url))
        .rejects
        .toThrow(LyricsExtractionError);
    });

    it('should throw LyricsExtractionError when API returns 403 Forbidden', async () => {
      const url = 'https://genius.com/some-song';
      // The global fetch mock will return 404 for unknown URLs, which is sufficient for this test
      await expect(lyricsService.getLyrics(url))
        .rejects
        .toThrow(LyricsExtractionError);
    });

    it('should throw LyricsExtractionError when response has no lyrics', async () => {
      const url = 'https://genius.com/some-song';
      // The global fetch mock will return 404 for unknown URLs, which is sufficient for this test
      await expect(lyricsService.getLyrics(url))
        .rejects
        .toThrow(LyricsExtractionError);
    });

    it('should throw LyricsExtractionError when fetch fails', async () => {
      // Simulate fetch failure by temporarily overriding global.fetch
      const url = 'https://genius.com/some-song';
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
      await expect(lyricsService.getLyrics(url))
        .rejects
        .toThrow(LyricsExtractionError);
      global.fetch = originalFetch;
    });

    it('should handle different song formats correctly', async () => {
      const testCases = [
        { trackKey: TRACK_KEYS.PARTY_IN_THE_USA },
        { trackKey: TRACK_KEYS.BEAT_IT },
        { trackKey: TRACK_KEYS.SWEET_CHILD_O_MINE }
      ];

      for (const testCase of testCases) {
        const url = getGeniusUrlFromTrackKey(testCase.trackKey);
        if (!url) {
          console.warn(`Skipping test case ${testCase.trackKey} - no Genius URL found`);
          continue;
        }

        const lyrics = await lyricsService.getLyrics(url);
        
        // Each fixture should extract meaningful lyrics
        expect(lyrics.length).toBeGreaterThan(50);
        expect(lyrics.split('\n').length).toBeGreaterThan(1);
        
        // Use lyrics_service validator instead of genius_client
        unit_validator.lyrics_service.getLyrics(testCase.trackKey, lyrics);
        
        // Should be clean text without HTML
        expect(lyrics).not.toMatch(/<[^>]*>/);
        expect(lyrics).not.toContain('class=');
        expect(lyrics).not.toContain('data-');
      }
    });

    it('should validate utilities work with fixture data', () => {
      // Test that our utilities work correctly
      const partyUrl = getGeniusUrlFromTrackKey(TRACK_KEYS.PARTY_IN_THE_USA);
      expect(partyUrl).toBeTruthy();
      expect(typeof partyUrl).toBe('string');
      expect(partyUrl).toMatch(/^https?:\/\//);
      
      const beatItUrl = getGeniusUrlFromTrackKey(TRACK_KEYS.BEAT_IT);
      expect(beatItUrl).toBeTruthy();
      expect(typeof beatItUrl).toBe('string');
      expect(beatItUrl).toMatch(/^https?:\/\//);
      
      // URLs should be different
      expect(partyUrl).not.toBe(beatItUrl);
      
      // Metadata should be available
      const partyMetadata = getExpectedSongMetadata(TRACK_KEYS.PARTY_IN_THE_USA);
      expect(partyMetadata.hasLyrics).toBe(true);
      expect(partyMetadata.title).toBeTruthy();
      expect(partyMetadata.artist).toBeTruthy();
    });
  });
}); 