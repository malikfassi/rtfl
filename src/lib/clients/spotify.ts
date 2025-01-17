import SpotifyWebApi from 'spotify-web-api-node';

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount: number;
}

export class SpotifyClient {
  private client: SpotifyWebApi;

  constructor() {
    this.client = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  async searchPlaylists(query: string): Promise<SpotifyPlaylist[]> {
    await this.refreshAccessToken();
    const response = await this.client.searchPlaylists(query, { limit: 50 });
    
    return response.body.playlists?.items
      .filter((playlist): playlist is NonNullable<typeof playlist> => 
        playlist !== null && 
        typeof playlist === 'object' && 
        'id' in playlist
      )
      .map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        imageUrl: playlist.images?.[0]?.url,
        trackCount: playlist.tracks.total
      })) || [];
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    await this.refreshAccessToken();
    const response = await this.client.getPlaylistTracks(playlistId);
    
    return response.body.items
      .map(item => item.track)
      .filter((track): track is NonNullable<typeof track> => 
        track !== null && 'id' in track
      )
      .map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        imageUrl: track.album.images?.[0]?.url
      }));
  }

  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    await this.refreshAccessToken();
    const response = await this.client.getTrack(trackId);
    
    if (!response.body) return null;
    
    const track = response.body;
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      imageUrl: track.album.images?.[0]?.url
    };
  }

  private async refreshAccessToken() {
    const response = await this.client.clientCredentialsGrant();
    this.client.setAccessToken(response.body.access_token);
  }
}

// Export a singleton instance
export const spotifyClient = new SpotifyClient();

// Keep the factory function for testing/mocking
export function createSpotifyClient() {
  return new SpotifyClient();
} 