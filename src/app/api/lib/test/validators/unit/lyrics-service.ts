import { getExpectedSongMetadata } from '../../utils/genius';
import { TRACK_KEYS } from '../../constants';
import { fixtures } from '../../fixtures';
import * as cheerio from 'cheerio';
import { decode } from 'html-entities';
import { extractLyricsFromHtml } from '../../../services/lyrics';

export const lyricsService = {
  getLyrics: (key: string, lyrics: string) => {
    expect(lyrics).toBeDefined();
    expect(typeof lyrics).toBe('string');
    expect(lyrics.length).toBeGreaterThan(0);
    
    // Should be clean text without HTML
    expect(lyrics).not.toMatch(/<[^>]*>/);
    expect(lyrics).not.toContain('class=');
    expect(lyrics).not.toContain('data-');
    
    // Compare with fixture
    const fixture = fixtures.genius.lyrics[key];
    const expectedLyrics = extractLyricsFromHtml(fixture);
    expect(expectedLyrics).toBeDefined();
    expect(expectedLyrics.length).toBeGreaterThan(0);
    expect(lyrics).toBe(expectedLyrics);
    
    // Validate against metadata
    const metadata = getExpectedSongMetadata(key as keyof typeof TRACK_KEYS);
    if (metadata.hasLyrics && metadata.title) {
      const titleWords = metadata.title.toLowerCase().split(/\s+/);
      const contentLower = lyrics.toLowerCase();
      
      const hasRelevantContent = titleWords.some(word => 
        word.length > 2 && contentLower.includes(word)
      );
      
      if (!hasRelevantContent && !contentLower.includes('licensing')) {
        console.warn(`No title words found in lyrics for ${key}, but this may be normal`);
      }
    }
    
    return lyrics;
  }
}; 