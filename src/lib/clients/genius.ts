import { decode } from 'html-entities';
import { 
  GeniusApiError,
  NoMatchingLyricsError,
  LyricsExtractionError
} from '@/lib/errors/genius';
import { validateSchema } from '@/lib/validation';
import { searchQuerySchema } from '@/lib/validation';
import type { GeniusSearchResponse } from '@/types/genius';

export interface GeniusClient {
  search(query: string): Promise<GeniusSearchResponse>;
  getLyrics(url: string): Promise<string | null>;
}

export class GeniusClientImpl implements GeniusClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    if (!accessToken) {
      throw new GeniusApiError(new Error('Missing access token'));
    }
    this.accessToken = accessToken;
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://api.genius.com${path}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new GeniusApiError(error as Error);
    }
  }

  protected async extractLyricsFromHTML(html: string): Promise<string | null> {
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

  async search(query: string): Promise<GeniusSearchResponse> {
    const validatedQuery = validateSchema(searchQuerySchema, query);

    try {
      const response = await this.request<GeniusSearchResponse>('/search', { q: validatedQuery });
      if (response.response.hits.length === 0) {
        throw new NoMatchingLyricsError();
      }
      return response;
    } catch (error) {
      if (error instanceof NoMatchingLyricsError) throw error;
      throw new GeniusApiError(error as Error);
    }
  }

  async getLyrics(url: string): Promise<string | null> {
    if (!url) {
      throw new GeniusApiError(new Error('URL is required'));
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch lyrics page: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const lyrics = await this.extractLyricsFromHTML(html);
      if (!lyrics) {
        throw new LyricsExtractionError(new Error('Failed to extract lyrics from HTML'));
      }

      return lyrics;
    } catch (error) {
      if (error instanceof LyricsExtractionError) throw error;
      throw new GeniusApiError(error as Error);
    }
  }
}

// Default instance getter
let defaultClient: GeniusClientImpl | null = null;

export function getGeniusClient(): GeniusClientImpl {
  if (!defaultClient) {
    defaultClient = new GeniusClientImpl(process.env.GENIUS_ACCESS_TOKEN);
  }
  return defaultClient;
} 