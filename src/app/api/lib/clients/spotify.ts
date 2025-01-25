import type { SimplifiedPlaylist, Track, TrackReference } from '@spotify/web-api-ts-sdk';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

import { 
  NoMatchingPlaylistsError,
  NoMatchingTracksError,
  NoTracksInPlaylistError,
  PlaylistNotFoundError,
  SpotifyApiError,
  TrackNotFoundError} from '@/app/api/lib/errors/spotify';
import { searchQuerySchema,spotifyIdSchema } from '@/app/api/lib/validation';
import { validateSchema } from '@/app/api/lib/validation';
import { withRetry } from '@/app/api/lib/utils/retry';

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
      throw new SpotifyApiError(new Error('Spotify credentials not configured'));
    }

    this.client = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  async searchPlaylists(query: string): Promise<SimplifiedPlaylist[]> {
    const validatedQuery = validateSchema(searchQuerySchema, query);

    try {
      const response = await withRetry(() => 
        this.client.search(validatedQuery, ['playlist'], undefined, 50)
      );
      
      const playlists = response.playlists.items
        .filter(playlist => {
          if (!playlist || !playlist.name) return false;
          
          const searchTerms = validatedQuery.toLowerCase().split(' ');
          const playlistName = playlist.name.toLowerCase();
          const ownerName = playlist.owner?.display_name?.toLowerCase() || '';
          
          return searchTerms.every(term => 
            playlistName.includes(term) || ownerName.includes(term)
          );
        });

      return playlists.map(playlist => ({
        ...playlist,
        tracks: {
          href: '',
          total: 0
        } as TrackReference
      }));
    } catch (error) {
      if (error instanceof NoMatchingPlaylistsError) throw error;
      throw new SpotifyApiError(error as Error);
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const validatedId = validateSchema(spotifyIdSchema, playlistId);

    try {
      const response = await withRetry(() => 
        this.client.playlists.getPlaylistItems(validatedId)
      );
      
      const tracks = response.items
        .map(item => item.track)
        .filter((track): track is Track => 
          track !== null && 'id' in track && track.type === 'track'
        );

      if (tracks.length === 0) {
        throw new NoTracksInPlaylistError();
      }

      return tracks;
    } catch (error) {
      if (error instanceof NoTracksInPlaylistError) throw error;
      if (error instanceof Error && error.message.includes('404')) {
        throw new PlaylistNotFoundError(playlistId);
      }
      throw new SpotifyApiError(error as Error);
    }
  }

  async getTrack(trackId: string): Promise<Track> {
    const validatedId = validateSchema(spotifyIdSchema, trackId.replace(/^spotify:track:/, ''));

    try {
      return await withRetry(() => 
        this.client.tracks.get(validatedId)
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new TrackNotFoundError();
      }
      throw new SpotifyApiError(error as Error);
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    const validatedQuery = validateSchema(searchQuerySchema, query);

    try {
      const response = await withRetry(() => 
        this.client.search(validatedQuery, ['track'], undefined, 50)
      );
      
      const tracks = response.tracks.items.filter(track => {
        const searchTerms = validatedQuery.toLowerCase().split(' ');
        const trackName = track.name.toLowerCase();
        const artistNames = track.artists.map(artist => artist.name.toLowerCase());
        
        return searchTerms.every(term => 
          trackName.includes(term) || artistNames.some(name => name.includes(term))
        );
      });

      return tracks;
    } catch (error) {
      if (error instanceof NoMatchingTracksError) return [];
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
        throw new Error('Spotify credentials not configured. Please check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
      }

      defaultClient = new SpotifyClientImpl(clientId, clientSecret);
    } catch (error) {
      throw new SpotifyApiError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  return defaultClient;
} 