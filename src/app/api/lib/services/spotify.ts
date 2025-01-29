import type { Track } from '@spotify/web-api-ts-sdk';

import { getSpotifyClient } from '@/app/api/lib/clients/spotify';
import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema, spotifyIdSchema } from '@/app/api/lib/validation';

export class SpotifyService {
  private spotifyClient = getSpotifyClient();

  public async getTrack(id: string): Promise<Track> {
    const validatedId = validateSchema(spotifyIdSchema, id);
    return await this.spotifyClient.getTrack(validatedId);
  }

  public async searchTracks(query: string): Promise<Track[]> {
    const validatedQuery = validateSchema(searchQuerySchema, query);
    return await this.spotifyClient.searchTracks(validatedQuery);
  }
}

// Export singleton instance
export const spotifyService = new SpotifyService(); 