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
      throw new Error(`Genius API error: ${response.statusText}`);
    }

    return response.json();
  }

  async searchSong(title: string, artist: string): Promise<string | null> {
    try {
      // Log the original search terms
      console.log(`Searching lyrics for "${title}" by "${artist}"`);
      
      // Try different search combinations
      const searchQueries = [
        `${title} ${artist}`,                    // Full search
        `${title}`,                              // Just title
        `${title.split('(')[0]} ${artist}`,      // Title without parentheses
        `${title.split('-')[0]} ${artist}`       // Title before any dash
      ];

      for (const query of searchQueries) {
        console.log(`Trying search query: "${query}"`);
        const data = await this.request<GeniusSearchResponse>('/search', { q: query });

        // Find the best match
        const hit = data.response.hits.find(hit => {
          const resultTitle = hit.result.title.toLowerCase();
          const resultArtist = hit.result.primary_artist.name.toLowerCase();
          const searchTitle = title.toLowerCase();
          const searchArtist = artist.toLowerCase();

          // Check for artist match first
          const artistMatch = resultArtist.includes(searchArtist) || 
                            searchArtist.includes(resultArtist);

          if (!artistMatch) return false;

          // Then check title variations
          const titleVariations = [
            searchTitle,
            searchTitle.split('(')[0].trim(),
            searchTitle.split('-')[0].trim(),
            searchTitle.replace(/[^\w\s]/g, '')
          ];

          return titleVariations.some(variation => 
            resultTitle.includes(variation) || 
            variation.includes(resultTitle)
          );
        });

        if (hit) {
          console.log(`Found match: "${hit.result.title}" by "${hit.result.primary_artist.name}"`);
          
          // Fetch the song page
          const response = await fetch(hit.result.url);
          const html = await response.text();

          // Extract lyrics using Genius's new DOM structure
          const lyricsMatch = html.match(/window\.__PRELOADED_STATE__ = JSON\.parse\('(.+?)'\)/);
          if (lyricsMatch) {
            try {
              const state = JSON.parse(lyricsMatch[1].replace(/\\(.)/g, '$1'));
              const lyrics = state.songPage.lyricsData.body.html
                .replace(/<[^>]+>/g, '') // Remove HTML tags
                .replace(/\[.+?\]/g, '')  // Remove section headers
                .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
                .trim();

              if (lyrics.length > 0) {
                return lyrics;
              }
            } catch (e) {
              console.warn('Failed to parse lyrics from state:', e);
            }
          }

          // Fallback to DOM scraping if JSON parse fails
          const lyricsSelectors = [
            'div[class*="Lyrics__Container"]',
            'div[class*="lyrics"]',
            'div[class*="SongPage__Section"]'
          ];

          for (const selector of lyricsSelectors) {
            const domMatch = html.match(new RegExp(`<${selector}[^>]*>([^]*?)<\/${selector.split('[')[0]}>`));
            if (domMatch) {
              const lyrics = domMatch[1]
                .replace(/<[^>]+>/g, '')
                .replace(/\[.+?\]/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

              if (lyrics.length > 0) {
                return lyrics;
              }
            }
          }
        }
      }

      console.warn(`No lyrics found for "${title}" by "${artist}" after trying all variations`);
      return null;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geniusClient = new GeniusClient(); 