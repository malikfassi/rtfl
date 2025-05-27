import { decode } from 'html-entities';
import { env } from '@/app/api/lib/env';
import { LyricsExtractionError } from '@/app/api/lib/errors/services/lyrics';

export class LyricsService {
  /**
   * Get lyrics for a song using its Genius ID
   */
  public async getLyrics(songId: string): Promise<string> {
    try {
      // Fetch lyrics using Genius API
      const response = await fetch(`https://api.genius.com/songs/${songId}?text_format=plain`, {
        headers: {
          'Authorization': `Bearer ${env.GENIUS_ACCESS_TOKEN}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lyrics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const lyrics = data.response.song.description?.plain;
      
      if (!lyrics) {
        throw new Error('No lyrics found in API response');
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

// Export singleton instance
export const lyricsService = new LyricsService();
