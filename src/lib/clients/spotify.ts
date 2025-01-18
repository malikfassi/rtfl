import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { Track, SimplifiedPlaylist, TrackReference } from '@spotify/web-api-ts-sdk';

export class SpotifyClient {
  private client: SpotifyApi;

  constructor() {
    this.client = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID || '',
      process.env.SPOTIFY_CLIENT_SECRET || ''
    );
  }

  async searchPlaylists(query: string): Promise<SimplifiedPlaylist[]> {
    const response = await this.client.search(query, ['playlist'], undefined, 50);
    return response.playlists.items.map(playlist => ({
      ...playlist,
      tracks: {
        href: '',
        total: 0
      } as TrackReference
    })) as SimplifiedPlaylist[];
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const response = await this.client.playlists.getPlaylistItems(playlistId);
    return response.items
      .map(item => item.track)
      .filter((track): track is Track => 
        track !== null && 'id' in track && track.type === 'track'
      );
  }

  async getTrack(trackId: string): Promise<Track | null> {
    try {
      return await this.client.tracks.get(trackId);
    } catch (error) {
      console.error('Failed to get track:', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    const response = await this.client.search(query, ['track'], undefined, 50);
    return response.tracks.items;
  }
}

// Export a singleton instance
export const spotifyClient = new SpotifyClient();

// Keep the factory function for testing/mocking
export function createSpotifyClient() {
  return new SpotifyClient();
} 