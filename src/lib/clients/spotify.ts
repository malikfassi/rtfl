import { SpotifyApi, PlaylistedTrack, Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
}

interface SpotifyPlaylistInfo {
  id: string;
  name: string;
  description: string | null;
  trackCount: number;
}

export class SpotifyClient {
  private client: SpotifyApi;

  constructor(clientId: string, clientSecret: string) {
    this.client = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  async searchPlaylists(query: string): Promise<SpotifyPlaylistInfo[]> {
    try {
      const data = await this.client.search(query, ['playlist'], undefined, 20);
      console.log('Spotify search response:', JSON.stringify(data.playlists, null, 2));
      
      return data.playlists.items
        .filter((item): item is SimplifiedPlaylist => {
          if (!item) {
            console.warn('Received null item in search results');
            return false;
          }
          return true;
        })
        .map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackCount: playlist.tracks?.total ?? 0
        }));
    } catch (error) {
      console.error('Spotify search error:', error);
      throw new Error('Failed to search playlists');
    }
  }

  async getTrack(trackId: string): Promise<SpotifyTrack> {
    try {
      const track = await this.client.tracks.get(trackId);
      return {
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({ name: artist.name })),
        preview_url: track.preview_url
      };
    } catch (error) {
      console.error('Failed to get track:', error);
      throw new Error('Failed to get track from Spotify');
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      const data = await this.client.playlists.getPlaylistItems(playlistId);
      console.log('Playlist tracks response:', JSON.stringify(data, null, 2));
      
      const seenIds = new Set<string>();
      
      const tracks = data.items
        .filter((item): item is PlaylistedTrack & { track: Track } => {
          if (!item.track || item.track.type !== 'track') {
            console.warn('Skipping item without valid track:', item);
            return false;
          }
          if (seenIds.has(item.track.id)) {
            console.warn('Skipping duplicate track:', item.track.id);
            return false;
          }
          seenIds.add(item.track.id);
          return true;
        })
        .map((item) => {
          const track = item.track;
          return {
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist) => ({ name: artist.name })),
            preview_url: track.preview_url
          };
        });

      console.log('Processed tracks:', tracks.length);
      return tracks;
    } catch (error) {
      console.error('Failed to get playlist tracks:', error);
      throw error;
    }
  }
}

export const spotifyClient = new SpotifyClient(
  process.env.SPOTIFY_CLIENT_ID || '',
  process.env.SPOTIFY_CLIENT_SECRET || ''
); 