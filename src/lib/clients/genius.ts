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

class GeniusError extends Error {
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

  constructor() {
    this.accessToken = process.env.GENIUS_ACCESS_TOKEN!;

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

  private extractLyricsFromHTML(html: string): string | null {
    // Try different selectors and patterns to find lyrics
    const patterns = [
      // Method 1: New DOM structure with preloaded state
      {
        regex: /window\.__PRELOADED_STATE__ = JSON\.parse\('(.+?)'\)/,
        extract: (match: string) => {
          try {
            const state = JSON.parse(match.replace(/\\(.)/g, '$1'));
            if (state?.songPage?.lyricsData?.body?.html) {
              return state.songPage.lyricsData.body.html;
            }
          } catch (e) {
            console.warn('Failed to parse state JSON:', e);
          }
          return null;
        }
      },
      // Method 2: Direct lyrics div
      {
        regex: /<div[^>]+class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        extract: (match: string) => match
      },
      // Method 3: Lyrics container
      {
        regex: /<div[^>]+class="[^"]*Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        extract: (match: string) => match
      }
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern.regex);
      if (match && match[1]) {
        const extracted = pattern.extract(match[1]);
        if (extracted) {
          const lyrics = extracted
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/\[.+?\]/g, '')  // Remove section headers
            .replace(/\d+ Contributors?/g, '') // Remove contributor count
            .replace(/Translations/g, '') // Remove translations text
            .replace(/Lyrics/g, '') // Remove "Lyrics" text
            .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
            .replace(/^\s+|\s+$/gm, '') // Trim each line
            .trim();

          if (lyrics.length > 0) {
            return lyrics;
          }
        }
      }
    }

    return null;
  }

  async searchSong(title?: string, artist?: string): Promise<string> {
    // Validate inputs
    if (!title || !artist) {
      throw new GeniusError(
        `Invalid search parameters: title="${title}", artist="${artist}"`,
        'GENIUS_API_ERROR'
      );
    }

    try {
      // Try different search variations
      const searchQueries = [
        `${title} ${artist}`,
        title,
        `${title} ${artist}`,
        `${title} ${artist}`
      ];

      for (const query of searchQueries) {
        console.log('Trying search query:', query);
        const response = await this.request<GeniusSearchResponse>('/search', {
          q: query
        });

        const hits = response.response.hits;
        if (hits.length === 0) continue;

        // Find best match
        const hit = hits.find(h => {
          const resultTitle = h.result.title.toLowerCase();
          const resultArtist = h.result.primary_artist.name.toLowerCase();
          const searchTitle = title.toLowerCase();
          const searchArtist = artist.toLowerCase();

          return (
            resultTitle.includes(searchTitle) ||
            searchTitle.includes(resultTitle) ||
            resultArtist.includes(searchArtist) ||
            searchArtist.includes(resultArtist)
          );
        });

        if (hit) {
          console.log('Found match:', `"${hit.result.title}" by "${hit.result.primary_artist.name}"`);
          
          // Fetch the song page
          const response = await fetch(hit.result.url);
          const html = await response.text();

          const lyrics = this.extractLyricsFromHTML(html);
          if (lyrics) {
            return lyrics;
          }
        }
      }

      throw new GeniusError(
        `No lyrics found for "${title}" by "${artist}"`,
        'GENIUS_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof GeniusError) {
        throw error;
      }
      console.error('Error searching for lyrics:', error);
      throw new GeniusError(
        `Failed to search lyrics for "${title}" by "${artist}"`,
        'GENIUS_API_ERROR'
      );
    }
  }
}

// Export singleton instance
export const geniusClient = new GeniusClient(); 