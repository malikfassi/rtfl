interface GeniusSearchResponse {
  response: {
    hits: Array<{
      result: {
        id: number;
        title: string;
        primary_artist: {
          name: string;
        };
        url: string;
      };
    }>;
  };
}

export class GeniusError extends Error {
  constructor(
    message: string,
    public code: 'GENIUS_NOT_FOUND' | 'GENIUS_PARSE_ERROR' | 'GENIUS_API_ERROR'
  ) {
    super(message);
    this.name = 'GeniusError';
  }
}

export class GeniusClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.GENIUS_ACCESS_TOKEN || '';

    if (!this.accessToken) {
      throw new Error('Genius access token not configured');
    }
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const url = `https://api.genius.com${path}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new GeniusError(
        `Genius API error: ${response.statusText}`,
        'GENIUS_API_ERROR'
      );
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
          const lyrics = extracted
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

  async searchSong(query: string): Promise<string | null> {
    try {
      // Search for the song
      const response = await this.request<GeniusSearchResponse>('/search', { q: query });
      const hits = response.response.hits;

      console.log(`Search query "${query}" returned ${hits.length} hits`);

      if (hits.length === 0) {
        console.log('No hits found, returning null');
        return null;
      }

      // Get the first result that matches the query terms
      const queryTerms = query.toLowerCase().split(' ');
      const hit = hits.find(hit => {
        const title = hit.result.title.toLowerCase();
        const artist = hit.result.primary_artist.name.toLowerCase();
        // Check if all query terms appear in either the title or artist name
        return queryTerms.every(term => title.includes(term) || artist.includes(term));
      });

      if (!hit) {
        console.log('No matching hits found, returning null');
        return null;
      }

      console.log('Found match:', `"${hit.result.title}" by "${hit.result.primary_artist.name}"`);
      
      // Fetch the song page
      const pageResponse = await fetch(hit.result.url);
      if (!pageResponse.ok) {
        console.error(`Failed to fetch lyrics page: ${pageResponse.statusText}`);
        return null;
      }

      const html = await pageResponse.text();
      const lyrics = await this.extractLyricsFromHTML(html);

      if (!lyrics) {
        console.log('No lyrics found in HTML, returning null');
        return null;
      }

      return lyrics;
    } catch (error) {
      console.error('Error searching for lyrics:', error);
      return null;
    }
  }
}

// Export a factory function instead of a singleton
let geniusClientInstance: GeniusClient | null = null;

export function getGeniusClient(accessToken?: string): GeniusClient {
  if (!geniusClientInstance) {
    geniusClientInstance = new GeniusClient(accessToken);
  }
  return geniusClientInstance;
}

// Remove the automatic singleton creation
// export const geniusClient = new GeniusClient(); 