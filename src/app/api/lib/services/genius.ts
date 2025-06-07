import { getGeniusClient } from '@/app/api/lib/clients/genius';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema } from '@/app/api/lib/validation';
import type { GeniusSearchResponse, GeniusHit } from '@/app/api/lib/types/genius';

export class GeniusService {
  private geniusClient = getGeniusClient();

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/\(feat[.a-zA-Z0-9, &]+\)/g, '') // Remove (feat. ...)
      .replace(/\[feat[.a-zA-Z0-9, &]+\]/g, '') // Remove [feat. ...]
      .replace(/feat[. ]*[a-zA-Z0-9, &]+/g, '') // Remove feat. ... anywhere
      .replace(/[.,/#!$%^&*;:{}=\-_`~()\[\]]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractFeaturedArtists(str: string): string[] {
    const matches = [];
    // (feat. ...)
    const paren = str.match(/\(feat[. ]*([^)]+)\)/i);
    if (paren && paren[1]) matches.push(...paren[1].split(/,|&/).map(s => s.trim().toLowerCase()));
    // [feat. ...]
    const bracket = str.match(/\[feat[. ]*([^\]]+)\]/i);
    if (bracket && bracket[1]) matches.push(...bracket[1].split(/,|&/).map(s => s.trim().toLowerCase()));
    // feat. ...
    const feat = str.match(/feat[. ]*([a-zA-Z0-9, &]+)/i);
    if (feat && feat[1]) matches.push(...feat[1].split(/,|&/).map(s => s.trim().toLowerCase()));
    return matches.filter(Boolean);
  }

  private findBestMatch(
    spotifyTitle: string,
    spotifyArtist: string,
    hits: GeniusSearchResponse['response']['hits']
  ): GeniusHit | null {
    const normalize = this.normalize;
    const extractFeaturedArtists = this.extractFeaturedArtists;

    const normalizedTitle = normalize(spotifyTitle);
    const normalizedArtist = normalize(spotifyArtist);
    const featuredArtists = Array.from(new Set([
      ...extractFeaturedArtists(spotifyTitle),
      ...extractFeaturedArtists(spotifyArtist)
    ]));

    console.log('Normalized search:', {
      title: normalizedTitle,
      artist: normalizedArtist,
      featuredArtists
    });

    // Try to find a match with flexible logic
    for (const hit of hits) {
      if (!hit.result.primary_artist) continue;
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      const hitFeatured = [
        ...extractFeaturedArtists(hit.result.title),
        ...extractFeaturedArtists(hit.result.primary_artist.name)
      ];
      // Main artist match
      const mainArtistMatch = hitArtist.includes(normalizedArtist) || normalizedArtist.includes(hitArtist);
      // Title match (ignoring feat)
      const titleMatch = hitTitle === normalizedTitle;
      // All featured artists present
      const allFeaturedPresent = featuredArtists.every(fa => hitArtist.includes(fa) || hitFeatured.includes(fa));
      // Log for debugging
      console.log('Comparing with:', {
        title: hitTitle,
        artist: hitArtist,
        hitFeatured
      });
      if (mainArtistMatch && titleMatch && (featuredArtists.length === 0 || allFeaturedPresent)) {
        return hit;
      }
    }

    // Fallback: partial match
    for (const hit of hits) {
      if (!hit.result.primary_artist) continue;
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      if ((hitTitle.includes(normalizedTitle) || normalizedTitle.includes(hitTitle)) &&
          (hitArtist.includes(normalizedArtist) || normalizedArtist.includes(hitArtist))) {
        return hit;
      }
    }

    // Fuzzy match: artist matches, title has significant overlap
    for (const hit of hits) {
      if (!hit.result.primary_artist) continue;
      const hitTitle = normalize(hit.result.title);
      const hitArtist = normalize(hit.result.primary_artist.name);
      if (hitArtist !== normalizedArtist) continue;
      const titleWords = normalizedTitle.split(' ');
      const hitWords = hitTitle.split(' ');
      const commonWords = titleWords.filter(word => hitWords.includes(word));
      if (commonWords.length >= Math.min(titleWords.length, hitWords.length) * 0.5) {
        return hit;
      }
    }

    return null;
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
    // 1. Try original search
    let searchResult = await this.search(`${title} ${artist}`);
    let bestMatch = this.findBestMatch(title, artist, searchResult.response.hits);

    // 2. If no match, try normalized search
    if (!bestMatch) {
      const normalizedTitle = this.normalize(title);
      const normalizedArtist = this.normalize(artist);
      searchResult = await this.search(`${normalizedTitle} ${normalizedArtist}`);
      bestMatch = this.findBestMatch(normalizedTitle, normalizedArtist, searchResult.response.hits);
    }

    if (!bestMatch) {
      throw new NoMatchingLyricsError();
    }
    return bestMatch;
  }
}
// Export singleton instance
export const geniusService = new GeniusService();

