import { decode } from 'html-entities';

import { LyricsExtractionError } from '@/app/api/lib/errors/services/lyrics';


export class LyricsService {
  /**
   * Extract lyrics from HTML content
   */
  public async getLyrics(url: string): Promise<string> {
    const html = await this.fetchHtml(url);
    const lyrics = this.extractLyricsFromHTML(html);
    
    if (!lyrics) {
      throw new LyricsExtractionError(new Error('Failed to extract lyrics from HTML'));
    }

    return lyrics;
  }

  /**
   * Fetch HTML content from a URL
   */
  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch lyrics page: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new LyricsExtractionError(error as Error);
    }
  }

  /**
   * Extract clean lyrics text from HTML content
   */
  private extractLyricsFromHTML(html: string): string | null {
    // Try different selectors and patterns to find lyrics
    const patterns = [
      // Method 1: Modern lyrics container with data attribute (most reliable)
      {
        regex: /<div[^>]+?data-lyrics-container[^>]*?>([\s\S]*?)<\/div>/gi,
        extract: (matches: RegExpMatchArray | null) => {
          if (!matches) return null;
          return Array.from(matches)
            .map(match => match.replace(/<div[^>]+?data-lyrics-container[^>]*?>/i, '')
                              .replace(/<\/div>/i, '')
                              .trim())
            .join('\n\n');
        }
      },
      // Method 2: Legacy lyrics div
      {
        regex: /<div[^>]+?class="lyrics"[^>]*?>([\s\S]*?)<\/div>/i,
        extract: (match: RegExpMatchArray | null) => {
          if (!match || !match[1]) return null;
          return match[1];
        }
      }
    ];

    for (const pattern of patterns) {
      const matches = html.match(pattern.regex);
      if (matches) {
        const extracted = pattern.extract(matches);
        if (extracted) {
          // Clean up the lyrics text
          const lyrics = decode(extracted)
            .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
            .replace(/<[^>]+>/g, '')  // Remove remaining HTML tags
            .replace(/\[.+?\]/g, '')   // Remove section headers
            .replace(/\{.+?\}/g, '')   // Remove annotations
            .replace(/\(\d+x\)/g, '')  // Remove repeat indicators
            .replace(/\s*\n\s*/g, '\n')  // Normalize whitespace around newlines
            .replace(/\n{3,}/g, '\n\n')  // Normalize multiple newlines
            .replace(/^\s+|\s+$/g, '')   // Trim start/end whitespace
            .trim();

          if (lyrics.length > 0) {
            return lyrics;
          }
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const lyricsService = new LyricsService();
