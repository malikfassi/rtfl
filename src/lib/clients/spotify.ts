import { SpotifyApi, PlaylistedTrack, Track, SimplifiedPlaylist, Image } from '@spotify/web-api-ts-sdk';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
}

interface SpotifyPlaylist {
  tracks: SpotifyTrack[];
}

interface SpotifyPlaylistInfo {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[];
}

export class SpotifyClient {
  private client: SpotifyApi;

  constructor(clientId: string, clientSecret: string) {
    this.client = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  async getUserPlaylists(): Promise<SpotifyPlaylistInfo[]> {
    const data = await this.client.playlists.getUsersPlaylists(
      process.env.SPOTIFY_USER_ID || ''
    );

    return data.items.map((playlist: SimplifiedPlaylist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images.map((image: Image) => ({ url: image.url }))
    }));
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyPlaylist> {
    const data = await this.client.playlists.getPlaylistItems(
      playlistId,
      undefined,
      'items(track(id,name,artists(name),preview_url))'
    );

    return {
      tracks: data.items
        .filter((item): item is PlaylistedTrack<Track> => 
          item.track?.type === 'track' && 'artists' in item.track
        )
        .map(item => ({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map(artist => ({ name: artist.name })),
          preview_url: item.track.preview_url,
        })),
    };
  }
}

export const spotifyClient = new SpotifyClient(
  process.env.SPOTIFY_CLIENT_ID || '',
  process.env.SPOTIFY_CLIENT_SECRET || ''
); 