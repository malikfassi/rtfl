import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { Track, SimplifiedPlaylist, TrackReference } from '@spotify/web-api-ts-sdk';
import {
  SpotifyError,
  SpotifyApiError,
  TrackNotFoundError,
  PlaylistNotFoundError,
  MissingTrackIdError,
  MissingPlaylistIdError,
  MissingSearchQueryError
} from '@/lib/errors/spotify';

export interface SpotifyClient {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
  searchPlaylists(query: string): Promise<SimplifiedPlaylist[]>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
}

// Real implementation
export class SpotifyClientImpl implements SpotifyClient {
  private client: SpotifyApi;

  constructor(
    private clientId: string,
    private clientSecret: string
  ) {
    if (!clientId || !clientSecret) {
      throw new SpotifyError('Spotify credentials not configured');
    }

    this.client = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  private handleSpotifyError(error: unknown, context: string): never {
    console.error(`Spotify ${context} error:`, error);
    
    // Already transformed errors pass through
    if (error instanceof SpotifyError) {
      throw error;
    }

    // Handle API errors
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        if (context.includes('track')) {
          throw new TrackNotFoundError();
        }
        if (context.includes('playlist')) {
          throw new PlaylistNotFoundError();
        }
      }
      throw new SpotifyApiError(error);
    }

    // Unknown errors
    throw new SpotifyApiError(new Error(`Failed to ${context}`));
  }

  async searchPlaylists(query: string): Promise<SimplifiedPlaylist[]> {
    if (!query?.trim()) {
      throw new MissingSearchQueryError();
    }

    try {
      const response = await this.client.search(query, ['playlist'], undefined, 50);
      return response.playlists.items.map(playlist => ({
        ...playlist,
        tracks: {
          href: '',
          total: 0
        } as TrackReference
      })) as SimplifiedPlaylist[];
    } catch (error) {
      throw this.handleSpotifyError(error, 'search playlists');
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    if (!playlistId) {
      throw new MissingPlaylistIdError();
    }

    try {
      const response = await this.client.playlists.getPlaylistItems(playlistId);
      return response.items
        .map(item => item.track)
        .filter((track): track is Track => 
          track !== null && 'id' in track && track.type === 'track'
        );
    } catch (error) {
      throw this.handleSpotifyError(error, 'get playlist tracks');
    }
  }

  async getTrack(trackId: string): Promise<Track> {
    if (!trackId?.trim()) {
      throw new MissingTrackIdError();
    }

    const id = trackId.replace(/^spotify:track:/, '');
    if (!/^[a-zA-Z0-9]{22}$/.test(id)) {
      throw new MissingTrackIdError();
    }

    return await this.client.tracks.get(id);
  }

  async searchTracks(query: string): Promise<Track[]> {
    if (!query?.trim()) {
      throw new MissingSearchQueryError();
    }

    try {
      const response = await this.client.search(query, ['track'], undefined, 50);
      return response.tracks.items.filter(track => {
        const searchTerms = query.toLowerCase().split(' ');
        const trackName = track.name.toLowerCase();
        const artistNames = track.artists.map(artist => artist.name.toLowerCase());
        
        return searchTerms.every(term => 
          trackName.includes(term) || artistNames.some(name => name.includes(term))
        );
      });
    } catch (error) {
      throw this.handleSpotifyError(error, 'search tracks');
    }
  }
}

// Default instance getter
let defaultClient: SpotifyClientImpl | null = null;

export function getSpotifyClient(): SpotifyClientImpl {
  if (!defaultClient) {
    defaultClient = new SpotifyClientImpl(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
  }
  return defaultClient;
} 