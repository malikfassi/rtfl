import type { Page, Playlist, Track, SpotifyApi as SpotifyApiType } from '@spotify/web-api-ts-sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

import { SpotifyApiError, PlaylistNotFoundError, TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { withRetry } from '@/app/api/lib/utils/retry';

export interface SpotifyClient {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
  searchPlaylists(query: string): Promise<Page<Playlist>>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
}

export class SpotifyClientImpl implements SpotifyClient {
  private client: SpotifyApiType | SpotifyClient;

  constructor(
    private clientId: string,
    private clientSecret: string,
    client?: SpotifyClient
  ) {
    if (!clientId || !clientSecret) {
      throw SpotifyApiError.missingCredentials();
    }

    this.client = client || SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  async searchPlaylists(query: string): Promise<Page<Playlist>> {
    try {
      if (this.client instanceof SpotifyApi) {
        console.log('Searching playlists with query:', query);
        const response = await withRetry(() => 
          (this.client as SpotifyApiType).search(query, ['playlist'], undefined, 50)
        );
        console.log('Raw search response:', JSON.stringify(response, null, 2));
        return response.playlists as Page<Playlist>;
      }
      return this.client.searchPlaylists(query);
    } catch (error) {
      throw new SpotifyApiError(error as Error);
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    try {
      if (this.client instanceof SpotifyApi) {
        const response = await withRetry(() => 
          (this.client as SpotifyApiType).playlists.getPlaylistItems(playlistId.replace(/^spotify:playlist:/, ''))
        );
        
        return response.items
          .map(item => item.track)
          .filter((track): track is Track => 
            track !== null && 'id' in track && track.type === 'track'
          );
      }
      return this.client.getPlaylistTracks(playlistId);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('404') || 
        error.message.includes('Invalid base62 id')
      )) {
        throw new PlaylistNotFoundError(playlistId);
      }
      throw new SpotifyApiError(error as Error);
    }
  }

  async getTrack(trackId: string): Promise<Track> {
    try {
      if (this.client instanceof SpotifyApi) {
        return await withRetry(() => 
          (this.client as SpotifyApiType).tracks.get(trackId.replace(/^spotify:track:/, ''))
        );
      }
      return this.client.getTrack(trackId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new TrackNotFoundError();
      }
      throw new SpotifyApiError(error as Error);
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      if (this.client instanceof SpotifyApi) {
        const response = await withRetry(() => 
          (this.client as SpotifyApiType).search(query, ['track'], undefined, 50)
        );
        return response.tracks.items;
      }
      return this.client.searchTracks(query);
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