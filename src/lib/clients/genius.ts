import { decode } from 'html-entities';
import {
  GeniusError,
  GeniusApiError,
  LyricsNotFoundError,
  MissingLyricsUrlError,
  LyricsPageError
} from '@/lib/errors/genius';

// Raw API response type
interface RawGeniusSearchResponse {
  response: {
    hits: Array<{
      result: {
        id: number;
        title: string;
        url: string;
        primary_artist?: {
          name: string;
        };
      };
    }>;
  };
}

export interface GeniusSearchResult {
  id: number;
  title: string;
  primary_artist: {
    name: string;
  };
  url: string;
}

export interface GeniusSearchResponse {
  response: {
    hits: Array<{
      result: GeniusSearchResult;
    }>;
  };
}

export interface GeniusClient {
  search(query: string): Promise<GeniusSearchResponse>;
  searchSong(title: string, artist: string): Promise<string>;
}

export class GeniusClientImpl implements GeniusClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    if (!accessToken) {
      throw new GeniusError('Access token is required');
    }
    this.accessToken = accessToken;
  }

  private handleGeniusError(error: unknown, context: string): never {
    console.error(`Genius ${context} error:`, error);
    
    if (error instanceof GeniusError) {
      throw error;
    }

    throw new GeniusApiError(error instanceof Error ? error : new Error(String(error)));
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://api.genius.com${path}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new GeniusApiError(new Error(`${response.status} ${response.statusText}`));
    }

    return response.json();
  }

  private async extractLyricsFromHTML(html: string): Promise<string | null> {
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
    if (!query?.trim()) {
      throw new GeniusError('Search query is required');
    }

    try {
      const response = await this.request<RawGeniusSearchResponse>('/search', { q: query });
      return {
        response: {
          hits: response.response.hits.map(hit => ({
            result: {
              id: hit.result.id,
              title: hit.result.title,
              url: hit.result.url,
              primary_artist: {
                name: hit.result.primary_artist?.name || ''
              }
            }
          }))
        }
      };
    } catch (error) {
      throw this.handleGeniusError(error, 'search');
    }
  }

  async searchSong(title: string, artist: string): Promise<string> {
    // Input validation
    if (!title?.trim()) {
      throw new GeniusError('Title is required');
    }

    if (!artist?.trim()) {
      throw new GeniusError('Artist is required');
    }

    // Validate input format
    const invalidCharRegex = /^[!@#$%^&*()]+$/;
    if (invalidCharRegex.test(title) || invalidCharRegex.test(artist)) {
      throw new GeniusError('Invalid input format');
    }

    // Try multiple search variations
    const searchAttempts = [
      `${title} ${artist}`,
      title.replace(/\s*-\s*remix/i, '') + ` ${artist}`, // Try without "remix"
      `${title.replace(/\([^)]*\)/g, '').trim()} ${artist}`, // Remove parentheses
      `${title.replace(/\s*(?:feat|ft|featuring)\.?.*/i, '').trim()} ${artist}` // Remove 'feat.'
    ];

    for (const query of searchAttempts) {
      try {
        console.log('Trying search query:', query);
        const response = await this.request<GeniusSearchResponse>('/search', { q: query });
        const hits = response.response.hits;

        console.log(`Search query "${query}" returned ${hits.length} hits`);

        if (hits.length === 0) {
          if (query === searchAttempts[searchAttempts.length - 1]) {
            throw new LyricsNotFoundError();
          }
          continue;
        }

        const hit = this.findMatchingHit(hits, title, artist);
        if (!hit) {
          if (query === searchAttempts[searchAttempts.length - 1]) {
            throw new LyricsNotFoundError();
          }
          continue;
        }

        console.log('Found match:', `"${hit.result.title}" by "${hit.result.primary_artist.name}"`);
        
        if (!hit.result.url) {
          throw new MissingLyricsUrlError();
        }

        const lyrics = await this.fetchAndExtractLyrics(hit.result.url);
        if (lyrics) {
          return lyrics;
        }
      } catch (error) {
        if (error instanceof GeniusError) {
          if (query === searchAttempts[searchAttempts.length - 1]) {
            throw error;
          }
          continue;
        }
        throw this.handleGeniusError(error, 'search song');
      }
    }

    throw new LyricsNotFoundError();
  }

  private findMatchingHit(hits: Array<{ result: GeniusSearchResult }>, title: string, artist: string) {
    return hits.find(hit => {
      const hitTitle = hit.result.title.toLowerCase();
      const hitArtist = hit.result.primary_artist.name.toLowerCase();
      
      // Skip translations and non-English results
      if (this.isTranslation(hitTitle, hitArtist)) {
        return false;
      }

      const queryTerms = `${title} ${artist}`.toLowerCase().split(' ');
      const isRemix = title.toLowerCase().includes('remix');

      if (isRemix) {
        // For remixes, check if the base song title and artist match
        const baseTitle = title.toLowerCase().replace(/\s*-\s*remix/i, '');
        return hitTitle.includes(baseTitle) && hitArtist.includes(artist.toLowerCase());
      }

      // For regular songs, check if all query terms appear in either the title or artist name
      return queryTerms.every(term => hitTitle.includes(term) || hitArtist.includes(term));
    });
  }

  private isTranslation(title: string, artist: string): boolean {
    const translationMarkers = [
      '[türkçe', 'çeviri]', '[русский', 'перевод]', 'translation',
      'traducción', 'tradução', 'ترجمه', '翻訳', '번역', 'traduzione'
    ];

    return translationMarkers.some(marker => 
      title.includes(marker) || artist.includes(marker)
    );
  }

  private async fetchAndExtractLyrics(url: string): Promise<string | null> {
    const pageResponse = await fetch(url);
    if (!pageResponse.ok) {
      throw new LyricsPageError(new Error(pageResponse.statusText));
    }

    const html = await pageResponse.text();
    return this.extractLyricsFromHTML(html);
  }
}

// Default instance getter
let defaultClient: GeniusClientImpl | null = null;

export function getGeniusClient(): GeniusClientImpl {
  if (!defaultClient) {
    defaultClient = new GeniusClientImpl(process.env.GENIUS_ACCESS_TOKEN!);
  }
  return defaultClient;
} 