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
    // Search for the song
    const query = `${title} ${artist}`;
    const data = await this.request<GeniusSearchResponse>('/search', { q: query });

    // Find the best match
    const hit = data.response.hits.find(hit => {
      const songTitle = hit.result.title.toLowerCase();
      const songArtist = hit.result.primary_artist.name.toLowerCase();
      return (
        songTitle.includes(title.toLowerCase()) &&
        songArtist.includes(artist.toLowerCase())
      );
    });

    if (!hit) {
      return null;
    }

    // Fetch the song page
    const response = await fetch(hit.result.url);
    const html = await response.text();

    // Extract lyrics (basic extraction, might need improvement)
    const lyricsMatch = html.match(/<div class="lyrics">([^]*?)<\/div>/);
    if (!lyricsMatch) {
      return null;
    }

    // Clean up the lyrics
    const lyrics = lyricsMatch[1]
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\[.+?\]/g, '') // Remove section headers [Verse], [Chorus], etc.
      .trim();

    return lyrics;
  }
}

// Export singleton instance
export const geniusClient = new GeniusClient(); 