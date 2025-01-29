import { decode } from 'html-entities';
import { z } from 'zod';

import { getGeniusClient } from '@/app/api/lib/clients/genius';
import { 
  LyricsExtractionError,
  NoMatchingLyricsError 
} from '@/app/api/lib/errors/clients/genius';
import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema } from '@/app/api/lib/validation';
import type { GeniusSearchResponse } from '@/app/types/genius';

// Schema for text to be masked
const maskTextSchema = z.string().min(1, 'Text to mask is required');

export class LyricsService {
  private geniusClient = getGeniusClient();

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

  public async searchLyrics(query: string): Promise<GeniusSearchResponse> {
    const validatedQuery = validateSchema(searchQuerySchema, query);

    const response = await this.geniusClient.search(validatedQuery);
    if (response.response.hits.length === 0) {
      throw new NoMatchingLyricsError();
    }
    return response;
  }

  public async getLyrics(url: string): Promise<string> {
    const html = await this.geniusClient.fetchLyricsPage(url);
    const lyrics = this.extractLyricsFromHTML(html);
    
    if (!lyrics) {
      throw new LyricsExtractionError(new Error('Failed to extract lyrics from HTML'));
    }

    return lyrics;
  }

  public mask(text: string): string {
    console.log('Masking text:', { text });
  
    // Validate the input
    const validatedText = validateSchema(maskTextSchema, text);
  
    // Mask only letters and numbers while preserving other characters
    const result = validatedText.replace(/\p{L}+|\p{N}+/gu, word => '_'.repeat(word.length));
  
    console.log('Masked result:', { result });
    return result;
  }

  public partial_mask(text: string, guessedWords: Set<string>): string {
    console.log('Partial masking:', { text, guessedWords: Array.from(guessedWords) });
  
    // Validate the input
    const validatedText = validateSchema(maskTextSchema, text);
  
    // Normalize guessedWords for case-insensitive matching
    const normalizedGuessedWords = new Set(
      Array.from(guessedWords).map(word => word.toLowerCase())
    );

    // Mask all letters and numbers, but preserve guessed words
    const result = validatedText.replace(/\p{L}+|\p{N}+/gu, (word) => {
      const normalizedWord = word.toLowerCase();
      return normalizedGuessedWords.has(normalizedWord) ? word : '_'.repeat(word.length);
    });
  
    console.log('Final result:', { result });
    return result;
  }
}

// Export singleton instance
export const lyricsService = new LyricsService(); 