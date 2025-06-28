import type { Track } from '@spotify/web-api-ts-sdk';
import type { SpotifyClient } from '@/app/types';

import { validateSchema } from '@/app/api/lib/validation';
import { searchQuerySchema, spotifyIdSchema } from '@/app/api/lib/validation';
import { getSpotifyClient } from '@/app/api/lib/clients/spotify';

export class SpotifyService {
  constructor(private spotifyClient: SpotifyClient) {}

  public async getTrack(id: string): Promise<Track> {
    const validatedId = validateSchema(spotifyIdSchema, id);
    return await this.spotifyClient.getTrack(validatedId);
  }

  public async searchTracks(query: string): Promise<Track[]> {
    const validatedQuery = validateSchema(searchQuerySchema, query);
    return await this.spotifyClient.searchTracks(validatedQuery);
  }
}

// Factory function to create SpotifyService with default client
export function createSpotifyService(client?: SpotifyClient): SpotifyService {
  if (client) {
    return new SpotifyService(client);
  }
  
  return new SpotifyService(getSpotifyClient());
} 