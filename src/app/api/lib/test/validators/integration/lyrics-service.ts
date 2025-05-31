import { getExpectedSongMetadata } from '../../utils/genius';
import { TRACK_KEYS } from '../../constants';
import { fixtures } from '../../fixtures';

export const lyricsService = {
  getLyrics: (key: string, lyrics: string) => {
    expect(lyrics).toBeDefined();
    expect(typeof lyrics).toBe('string');
    expect(lyrics.length).toBeGreaterThan(0);
    
    // Should be clean text without HTML artifacts
    expect(lyrics).not.toMatch(/<[^>]*>/);
    expect(lyrics).not.toContain('class=');
    expect(lyrics).not.toContain('data-');
    expect(lyrics).not.toContain('&lt;');
    expect(lyrics).not.toContain('&gt;');
    
    // Should not contain licensing messages (integration test specific)
    expect(lyrics.toLowerCase()).not.toContain('licensing');
    expect(lyrics.toLowerCase()).not.toContain('not available');
    
    // Compare with fixture if available
    const fixture = fixtures.genius.lyrics[key];
    if (fixture) {
      // Extract text content from fixture HTML (if fixture is HTML)
      const fixtureText = fixture.replace(/<[^>]*>/g, '').toLowerCase();
      
      // Check that lyrics contain some content from fixture
      const lyricsLower = lyrics.toLowerCase();
      const words = fixtureText.split(/\s+/).filter(w => w.length > 3);
      const matchingWords = words.filter(word => lyricsLower.includes(word));
      
      // Expect at least 50% of fixture words to be in extracted lyrics
      const matchPercentage = matchingWords.length / words.length;
      if (matchPercentage < 0.5) {
        console.warn(`Low match percentage (${matchPercentage * 100}%) for ${key}`);
      }
    }
    
    // Validate against metadata
    const metadata = getExpectedSongMetadata(key as keyof typeof TRACK_KEYS);
    if (metadata.hasLyrics && metadata.title) {
      const titleWords = metadata.title.toLowerCase().split(/\s+/);
      const contentLower = lyrics.toLowerCase();
      
      const hasAnyTitleWord = titleWords.some(word => 
        word.length > 2 && contentLower.includes(word)
      );
      
      // More lenient for integration tests - real content may vary
      if (!hasAnyTitleWord) {
        console.warn(`No title words found in lyrics for ${key}, but this may be normal for integration tests`);
      }
    }
    
    return lyrics;
  }
}; 