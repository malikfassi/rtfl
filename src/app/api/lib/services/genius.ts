import { getGeniusClient } from '@/app/api/lib/clients/genius';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema } from '@/app/api/lib/validation';
import type { GeniusSearchResponse, GeniusHit } from '@/app/api/lib/types/genius';

export class GeniusService {
  private geniusClient = getGeniusClient();

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
      if (!hit.result.primary_artist) return false;
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
      if (!hit.result.primary_artist) return false;
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
      if (!hit.result.primary_artist) return false;
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

  /**
   * Search for songs on Genius
   */
  public async search(query: string): Promise<GeniusSearchResponse> {
    const validatedQuery = validateSchema(searchQuerySchema, query);
    const response = await this.geniusClient.search(validatedQuery);
    
    if (response.response.hits.length === 0) {
      throw new NoMatchingLyricsError();
    }
    
    return response;
  }

  /**
   * Find the best matching song on Genius for a Spotify track
   */
  public async findMatch(title: string, artist: string): Promise<GeniusHit> {
    const searchResult = await this.search(`${title} ${artist}`);
    const bestMatch = this.findBestMatch(title, artist, searchResult.response.hits);
    
    if (!bestMatch) {
      throw new NoMatchingLyricsError();
    }

    return bestMatch;
  }
}
// Export singleton instance
export const geniusService = new GeniusService();

