import { env } from '@/app/api/lib/env';
import { GeniusApiError } from '@/app/api/lib/errors/clients/genius';
import type { GeniusSearchResponse } from '@/app/api/lib/types/genius';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import * as cheerio from 'cheerio';
import { decode } from 'html-entities';

export interface GeniusClient {
  search(query: string): Promise<GeniusSearchResponse>;
  fetchLyricsPage(url: string): Promise<string>;
  getLyrics(url: string): Promise<string>;
}

export class GeniusClientImpl implements GeniusClient {
  private accessToken: string;
  private client: GeniusClient;

  constructor(accessToken?: string, client?: GeniusClient) {
    if (!accessToken && !env.GENIUS_ACCESS_TOKEN) {
      throw new GeniusApiError(new Error('No access token provided'));
    }
    this.accessToken = accessToken || env.GENIUS_ACCESS_TOKEN;
    this.client = client || this.createDefaultClient();
  }

  private extractLyricsFromHtml(html: string): string {
    const $ = cheerio.load(html);
    
    // Check for licensing message
    const licensingMessage = $('.LyricsPlaceholder__Message-sc-14g6xqc-2, .LyricsPlaceholder__Container-sc-14g6xqc-0').text();
    if (licensingMessage && licensingMessage.toLowerCase().includes('licensing')) {
      return '[Lyrics not available due to licensing]';
    }

    // Try multiple selectors for lyrics container
    const selectors = [
      '[data-lyrics-container="true"]',
      '.lyrics',
      '[class*="Lyrics__Container"]',
      '[class*="Lyrics__Root"]',
      '[class*="Lyrics__Container-sc"]'
    ];

    for (const selector of selectors) {
      const lyricsContainer = $(selector);
      if (lyricsContainer.length > 0) {
        // Get all text nodes within the container
        const text = lyricsContainer
          .find('br')
          .replaceWith('\n')
          .end()
          .text()
          .trim();

        if (text && text !== '[No lyrics available]') {
          // Clean up the lyrics text
          return decode(text)
            .replace(/\[.+?\]/g, '')   // Remove section headers
            .replace(/\{.+?\}/g, '')   // Remove annotations
            .replace(/\(\d+x\)/g, '')  // Remove repeat indicators
            .replace(/\s*\n\s*/g, '\n')  // Normalize whitespace around newlines
            .replace(/\n{3,}/g, '\n\n')  // Normalize multiple newlines
            .replace(/^\s+|\s+$/g, '')   // Trim start/end whitespace
            .trim();
        }
      }
    }

    return '[No lyrics available]';
  }

  private createDefaultClient(): GeniusClient {
    return {
      search: async (query: string) => {
        try {
          const response = await fetch(
            `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              }
            }
          );

          if (!response.ok) {
            throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Error searching Genius:', error);
          throw new GeniusApiError(error as Error);
        }
      },

      fetchLyricsPage: async (url: string) => {
        try {
          // Try direct fetch first
          let response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          // If direct fetch fails, try with proxy
          if (!response.ok) {
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
            response = await fetch(proxyUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
              },
              signal: AbortSignal.timeout(10000)
            });
          }

          if (!response.ok) {
            throw new Error(`Failed to fetch lyrics page: ${JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              url: response.url
            })}`);
          }

          const html = await response.text();
          return html; // Return raw HTML, not extracted lyrics
        } catch (error) {
          console.error('Error fetching lyrics page:', error);
          if (error instanceof Error) {
            throw new GeniusApiError(error);
          } else {
            throw GeniusApiError.requestFailed(500, 'Unknown error occurred');
          }
        }
      },

      getLyrics: async (url: string) => {
        try {
          const lyrics = await this.fetchLyricsPage(url);
          if (!lyrics || lyrics === '[No lyrics available]') {
            throw new Error('No lyrics found on the page');
          }
          return lyrics;
        } catch (error) {
          console.error('Failed to get lyrics:', error);
          throw error;
        }
      }
    };
  }

  async search(query: string): Promise<GeniusSearchResponse> {
    return this.client.search(query);
  }

  async fetchLyricsPage(url: string): Promise<string> {
    return this.client.fetchLyricsPage(url);
  }

  async getLyrics(url: string): Promise<string> {
    return this.client.getLyrics(url);
  }
}

// Default instance getter
let defaultClient: GeniusClientImpl | null = null;

export function getGeniusClient(): GeniusClientImpl {
  if (!defaultClient) {
    defaultClient = new GeniusClientImpl(env.GENIUS_ACCESS_TOKEN);
  }
  return defaultClient;
}