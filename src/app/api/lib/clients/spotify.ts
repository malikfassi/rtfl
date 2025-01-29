import type { Page, PlaylistBase, Track } from '@spotify/web-api-ts-sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

import { SpotifyApiError, PlaylistNotFoundError, TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { withRetry } from '@/app/api/lib/utils/retry';

export interface SpotifyClient {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
  searchPlaylists(query: string): Promise<Page<PlaylistBase>>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
}

export class SpotifyClientImpl implements SpotifyClient {
  private client: SpotifyApi;

  constructor(
    private clientId: string,
    private clientSecret: string
  ) {
    if (!clientId || !clientSecret) {
      throw SpotifyApiError.missingCredentials();
    }

    this.client = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  async searchPlaylists(query: string): Promise<Page<PlaylistBase>> {
    try {
      const response = await withRetry(() => 
        this.client.search(query, ['playlist'], undefined, 50)
      );
      return response.playlists;
    } catch (error) {
      throw new SpotifyApiError(error as Error);
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    try {
      const response = await withRetry(() => 
        this.client.playlists.getPlaylistItems(playlistId)
      );
      
      return response.items
        .map(item => item.track)
        .filter((track): track is Track => 
          track !== null && 'id' in track && track.type === 'track'
        );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new PlaylistNotFoundError(playlistId);
      }
      throw new SpotifyApiError(error as Error);
    }
  }

  async getTrack(trackId: string): Promise<Track> {
    try {
      return await withRetry(() => 
        this.client.tracks.get(trackId.replace(/^spotify:track:/, ''))
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new TrackNotFoundError();
      }
      throw new SpotifyApiError(error as Error);
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await withRetry(() => 
        this.client.search(query, ['track'], undefined, 50)
      );
      return response.tracks.items;
    } catch (error) {
      throw new SpotifyApiError(error as Error);
    }
  }
}

// Default instance getter
let defaultClient: SpotifyClientImpl | null = null;

export function getSpotifyClient(): SpotifyClientImpl {
  if (!defaultClient) {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw SpotifyApiError.missingCredentials();
      }

      defaultClient = new SpotifyClientImpl(clientId, clientSecret);
    } catch (error) {
      throw new SpotifyApiError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  return defaultClient;
} 