import { load } from 'cheerio';
import { decode } from 'html-entities';
import { LyricsExtractionError } from '@/app/api/lib/errors/services/lyrics';

export function extractLyricsFromHtml(html: string): string {
  const $ = load(html);
  // Check for licensing message
  const licensingMessage = $('.LyricsPlaceholder__Message-sc-14g6xqc-2, .LyricsPlaceholder__Container-sc-14g6xqc-0').text();
  if (licensingMessage && licensingMessage.toLowerCase().includes('licensing')) {
    return '[Lyrics not available due to licensing]';
  }
  const selectors = [
    '[data-lyrics-container="true"]',
    '.lyrics',
    '[class*="Lyrics__Container"]',
    '[class*="Lyrics__Root"]',
    '[class*="Lyrics__Container-sc"]'
  ];
  let rawText = '';
  for (const selector of selectors) {
    const lyricsContainer = $(selector);
    if (lyricsContainer.length > 0) {
      const text = lyricsContainer
        .find('br')
        .replaceWith('\n')
        .end()
        .text()
        .trim();
      if (text && text !== '[No lyrics available]') {
        rawText = decode(text)
          .replace(/\[.+?\]/g, '')
          .replace(/\{.+?\}/g, '')
          .replace(/\(\d+x\)/g, '')
          .replace(/\s*\n\s*/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+|\s+$/g, '')
          .trim();
        break;
      }
    }
  }
  if (!rawText) return '[No lyrics available]';

  // Clean out non-lyric content (headers, contributors, translations, etc.)
  const nonLyricPatterns = [
    /^\d+\s*Contributors?$/i,
    /^Contributors?$/i,
    /^Translations?$/i,
    /^Read More$/i,
    /^Lyrics$/i,
    /^English$/i,
    /^Deutsch$/i,
    /^Paroles de la chanson/i,
    /^La chanson/i,
    /^\d+\s*$/,
    /^\s*$/, // empty lines
    /^\s*\p{L}{1,2}\s*$/u // single letters/words (often artifacts)
  ];
  const cleaned = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line =>
      line.length > 0 &&
      !nonLyricPatterns.some(pattern => pattern.test(line)) &&
      !/Read More/i.test(line) &&
      !/Translations?/i.test(line) &&
      !/Contributors?/i.test(line)
    )
    .join('\n')
    .replace(/^\s+|\s+$/g, '');

  return cleaned;
}

export class LyricsService {
  /**
   * Get lyrics by scraping the Genius lyrics page URL
   */
  public async getLyrics(url: string): Promise<string> {
    try {
      // Fetch the HTML page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lyrics page: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const lyrics = await extractLyricsFromHtml(html);
      
      if (!lyrics || lyrics === '[No lyrics available]') {
        throw new Error('No lyrics found on the page');
      }

      return lyrics;
    } catch (error) {
      throw new LyricsExtractionError(error as Error);
    }
  }

  /**
   * Extract song ID from Genius URL
   */
  private extractSongId(url: string): string | null {
    console.log('Trying to extract song ID from URL with these patterns:');
    // Try different URL patterns
    const patterns = [
      /\/songs\/(\d+)/, // Direct song ID
      /genius\.com\/([^-]+-)*?(\d+)$/, // ID at end of URL
      /genius\.com\/.*?-(\d+)-lyrics/, // ID in lyrics URL
      /genius\.com\/.*?-lyrics-(\d+)/, // ID after lyrics
      /genius\.com\/.*?-(\d+)/, // Any ID in URL
      /api_path"?:\s*"?\/songs\/(\d+)"?/ // From API response
    ];

    for (const pattern of patterns) {
      console.log(`Trying pattern: ${pattern}`);
      const match = url.match(pattern);
      if (match) {
        console.log(`Found match with pattern ${pattern}:`, match);
        // Return the last captured group (the ID)
        return match[match.length - 1];
      }
    }

    // If no pattern matches, try to find any number in the URL
    console.log('No pattern matched, trying to find any number in the URL');
    const numberMatch = url.match(/\d+/);
    if (numberMatch) {
      console.log('Found number:', numberMatch[0]);
    }
    return numberMatch ? numberMatch[0] : null;
  }
}

// Factory function to create new instances
export function createLyricsService() {
  return new LyricsService();
}
