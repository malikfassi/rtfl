import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { Track, SimplifiedPlaylist, TrackReference } from '@spotify/web-api-ts-sdk';

export class SpotifyClient {
  private client: SpotifyApi;

  constructor(clientId?: string, clientSecret?: string) {
    const id = clientId || process.env.SPOTIFY_CLIENT_ID;
    const secret = clientSecret || process.env.SPOTIFY_CLIENT_SECRET;

    if (!id || !secret) {
      throw new Error('Spotify credentials not configured');
    }

    this.client = SpotifyApi.withClientCredentials(id, secret);
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
      const id = trackId.replace(/^spotify:track:/, '');
      return await this.client.tracks.get(id);
    } catch (error) {
      console.error('Failed to get track:', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await this.client.search(query, ['track'], undefined, 50);
      // Filter tracks to only include exact matches
      return response.tracks.items.filter(track => {
        const searchTerms = query.toLowerCase().split(' ');
        const trackName = track.name.toLowerCase();
        const artistNames = track.artists.map(artist => artist.name.toLowerCase());
        
        // Check if all search terms appear in either the track name or artist names
        return searchTerms.every(term => 
          trackName.includes(term) || artistNames.some(name => name.includes(term))
        );
      });
    } catch (error) {
      console.error('Failed to search tracks:', error);
      return [];
    }
  }
}

// Export a factory function instead of a singleton
let spotifyClientInstance: SpotifyClient | null = null;

export function getSpotifyClient(clientId?: string, clientSecret?: string): SpotifyClient {
  if (!spotifyClientInstance) {
    spotifyClientInstance = new SpotifyClient(clientId, clientSecret);
  }
  return spotifyClientInstance;
} 