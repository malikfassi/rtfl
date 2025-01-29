import { decode } from 'html-entities';

import { getGeniusClient } from '@/app/api/lib/clients/genius';
import { LyricsExtractionError, NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema } from '@/app/api/lib/validation';
import type { GeniusSearchResponse } from '@/app/types/genius';

interface GeniusHit {
  result: {
    title: string;
    url: string;
    primary_artist: {
      name: string;
    };
  };
}

export class GeniusService {
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

  private findBestMatch(
    spotifyTitle: string,
    spotifyArtist: string,
    hits: GeniusSearchResponse['response']['hits']
  ): GeniusHit | null {
    // Normalize strings for comparison - keep it simple!
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')                      // Normalize whitespace
      .trim();

    const normalizedTitle = normalize(spotifyTitle);
    const normalizedArtist = normalize(spotifyArtist);

    console.log('Normalized search:', {
      title: normalizedTitle,
      artist: normalizedArtist
    });

    // Find exact match first
    const exactMatch = hits.find((hit: GeniusHit) => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      console.log('Comparing with:', {
        title: hitTitle,
        artist: hitArtist
      });
      return hitTitle === normalizedTitle && hitArtist === normalizedArtist;
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Find partial match - title must contain our title and artist must match
    const partialMatch = hits.find((hit: GeniusHit) => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      return (hitTitle.includes(normalizedTitle) || normalizedTitle.includes(hitTitle)) 
        && hitArtist === normalizedArtist;
    });

    if (partialMatch) {
      return partialMatch;
    }

    // Try fuzzy match - if artist matches exactly and title has significant overlap
    const fuzzyMatch = hits.find((hit: GeniusHit) => {
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      
      // Artist must match
      if (hitArtist !== normalizedArtist) return false;
      
      // Check if most words from one title appear in the other
      const titleWords = normalizedTitle.split(' ');
      const hitWords = hitTitle.split(' ');
      const commonWords = titleWords.filter(word => hitWords.includes(word));
      
      return commonWords.length >= Math.min(titleWords.length, hitWords.length) * 0.5;
    });

    return fuzzyMatch || null;
  }

  public async searchLyrics(query: string): Promise<GeniusSearchResponse> {
    const validatedQuery = validateSchema(searchQuerySchema, query);

    const response = await this.geniusClient.search(validatedQuery);
    if (response.response.hits.length === 0) {
      throw new NoMatchingLyricsError();
    }
    return response;
  }

  public async findLyrics(title: string, artist: string): Promise<GeniusHit> {
    const searchResult = await this.searchLyrics(`${title} ${artist}`);
    const bestMatch = this.findBestMatch(title, artist, searchResult.response.hits);
    
    if (!bestMatch) {
      throw new NoMatchingLyricsError();
    }

    return bestMatch;
  }

  public async getLyrics(url: string): Promise<string> {
    const html = await this.geniusClient.fetchLyricsPage(url);
    const lyrics = this.extractLyricsFromHTML(html);
    
    if (!lyrics) {
      throw new LyricsExtractionError(new Error('Failed to extract lyrics from HTML'));
    }

    return lyrics;
  }
}

// Export singleton instance
export const geniusService = new GeniusService();

// Export type for dependency injection
export type { GeniusService }; 