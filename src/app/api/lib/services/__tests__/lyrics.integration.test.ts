import { LyricsService } from '../lyrics';
import { LyricsExtractionError } from '@/app/api/lib/errors/services/lyrics';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { 
  getGeniusUrlFromTrackKey, 
  getExpectedSongMetadata 
} from '@/app/api/lib/test/utils/genius';
import { integration_validator } from '@/app/api/lib/test/validators';

describe('LyricsService Integration', () => {
  let lyricsService: LyricsService;

  beforeEach(async () => {
    await setupIntegrationTest();
    lyricsService = new LyricsService(); // Real service, no mocks
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('getLyrics with real API calls', () => {
    it('should extract lyrics for PARTY_IN_THE_USA song URL', async () => {
      const trackKey = TRACK_KEYS.PARTY_IN_THE_USA;
      const url = getGeniusUrlFromTrackKey(trackKey);
      
      if (!url) {
        throw new Error(`No Genius URL found for track key ${trackKey}`);
      }
      
      // Make real API call to Genius
      const lyrics = await lyricsService.getLyrics(url);
      
      // Validate result structure and content using existing validator
      expect(typeof lyrics).toBe('string');
      expect(lyrics.length).toBeGreaterThan(0);
      
      // Use existing integration validator
      integration_validator.lyrics_service.getLyrics(trackKey, lyrics);
      
      // Should be clean text without HTML
      expect(lyrics).not.toMatch(/<[^>]*>/);
      expect(lyrics).not.toContain('class=');
      expect(lyrics).not.toContain('data-');
      expect(lyrics).not.toContain('&lt;');
      expect(lyrics).not.toContain('&gt;');
    });

    it('should extract lyrics for BEAT_IT song URL', async () => {
      const trackKey = TRACK_KEYS.BEAT_IT;
      const url = getGeniusUrlFromTrackKey(trackKey);
      
      if (!url) {
        throw new Error(`No Genius URL found for track key ${trackKey}`);
      }
      
      const lyrics = await lyricsService.getLyrics(url);
      
      expect(typeof lyrics).toBe('string');
      expect(lyrics.length).toBeGreaterThan(0);
      expect(lyrics).not.toMatch(/<[^>]*>/);
      
      // Use existing integration validator
      integration_validator.lyrics_service.getLyrics(trackKey, lyrics);
      
      // Validate basic song identification
      const metadata = getExpectedSongMetadata(trackKey);
      if (metadata.hasLyrics) {
        expect(lyrics.toLowerCase()).toContain('beat');
      }
    });

    it('should extract lyrics for LA_VIE_EN_ROSE song URL (French)', async () => {
      const trackKey = TRACK_KEYS.LA_VIE_EN_ROSE;
      const url = getGeniusUrlFromTrackKey(trackKey);
      
      if (!url) {
        throw new Error(`No Genius URL found for track key ${trackKey}`);
      }
      
      const lyrics = await lyricsService.getLyrics(url);
      
      expect(typeof lyrics).toBe('string');
      expect(lyrics.length).toBeGreaterThan(0);
      expect(lyrics).not.toMatch(/<[^>]*>/);
      
      // Use existing integration validator
      integration_validator.lyrics_service.getLyrics(trackKey, lyrics);
      
      // Validate basic song identification
      const metadata = getExpectedSongMetadata(trackKey);
      if (metadata.hasLyrics) {
        expect(lyrics.toLowerCase()).toContain('vie');
      }
    });

    it('should handle non-existent song URLs gracefully', async () => {
      const url = 'https://genius.com/nonexistent-song-lyrics'; // Non-existent Genius URL
      
      await expect(lyricsService.getLyrics(url))
        .rejects
        .toThrow(LyricsExtractionError);
    });

    it('should handle invalid URLs gracefully', async () => {
      const url = 'invalid-url';
      
      await expect(lyricsService.getLyrics(url))
        .rejects
        .toThrow(LyricsExtractionError);
    });

    it('should validate lyrics format consistency across different songs', async () => {
      const testCases = [
        { trackKey: TRACK_KEYS.PARTY_IN_THE_USA },
        { trackKey: TRACK_KEYS.BEAT_IT },
        { trackKey: TRACK_KEYS.LA_VIE_EN_ROSE }
      ];

      for (const testCase of testCases) {
        const url = getGeniusUrlFromTrackKey(testCase.trackKey);
        if (!url) {
          console.warn(`Skipping test case ${testCase.trackKey} - no Genius URL found`);
          continue;
        }

        const lyrics = await lyricsService.getLyrics(url);
        
        // Each song should extract meaningful lyrics
        expect(lyrics.length).toBeGreaterThan(50);
        expect(lyrics.split('\n').length).toBeGreaterThan(1);
        
        // Use existing integration validator
        integration_validator.lyrics_service.getLyrics(testCase.trackKey, lyrics);
        
        // Validate basic content expectations from metadata
        const metadata = getExpectedSongMetadata(testCase.trackKey);
        if (metadata.hasLyrics && metadata.title) {
          // At minimum, should contain some reference to the song
          const titleWords = metadata.title.toLowerCase().split(/\s+/);
          const hasAnyTitleWord = titleWords.some(word => 
            word.length > 2 && lyrics.toLowerCase().includes(word)
          );
          // This is lenient since real lyrics might differ from fixture metadata
          if (!hasAnyTitleWord) {
            console.warn(`No title words found in lyrics for ${testCase.trackKey}`);
          }
        }
        
        // Should be clean text without HTML artifacts
        expect(lyrics).not.toMatch(/<[^>]*>/);
        expect(lyrics).not.toContain('class=');
        expect(lyrics).not.toContain('data-');
        expect(lyrics).not.toContain('&lt;');
        expect(lyrics).not.toContain('&gt;');
        
        // Should not contain licensing messages
        expect(lyrics.toLowerCase()).not.toContain('licensing');
        expect(lyrics.toLowerCase()).not.toContain('not available');
      }
    });

    it('should validate utility functions with fixture data', () => {
      // Test that our utilities work correctly
      const partyUrl = getGeniusUrlFromTrackKey(TRACK_KEYS.PARTY_IN_THE_USA);
      expect(partyUrl).toBeTruthy();
      expect(typeof partyUrl).toBe('string');
      expect(partyUrl).toMatch(/^https?:\/\//); // Should be a valid URL
      
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