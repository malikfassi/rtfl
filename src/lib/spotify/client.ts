import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { z } from 'zod';
import { SpotifyError } from '../errors';
import { getSpotifyApi } from './auth';

const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  previewUrl: z.string().nullable(),
});

const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  tracks: z.array(TrackSchema),
});

type Track = z.infer<typeof TrackSchema>;
type Playlist = z.infer<typeof PlaylistSchema>;

export class SpotifyClient {
  private api: SpotifyApi | null = null;

  private async getApi(): Promise<SpotifyApi> {
    if (!this.api) {
      this.api = await getSpotifyApi();
    }
    return this.api;
  }

  async searchPlaylist(query: string): Promise<Playlist[]> {
    try {
      const api = await this.getApi();
      const results = await api.search(query, ['playlist']);

      const playlists = [];
      for (const playlist of results.playlists.items) {
        const tracks = await api.playlists.getPlaylistItems(playlist.id);

        const formattedTracks = tracks.items
          .filter((item) => item.track?.type === 'track')
          .map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name || 'Unknown Artist',
            previewUrl: item.track.preview_url,
          }));

        playlists.push({
          id: playlist.id,
          name: playlist.name,
          tracks: formattedTracks,
        });
      }

      return PlaylistSchema.array().parse(playlists);
    } catch (error) {
      const err = new SpotifyError(
        error instanceof Error ? error.message : 'Failed to search playlists',
      );
      Object.setPrototypeOf(err, SpotifyError.prototype);
      throw err;
    }
  }

  async getTrack(trackId: string): Promise<Track> {
    try {
      const api = await this.getApi();
      const track = await api.tracks.get(trackId);

      const formattedTrack = {
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        previewUrl: track.preview_url,
      };

      return TrackSchema.parse(formattedTrack);
    } catch (error) {
      const err = new SpotifyError(error instanceof Error ? error.message : 'Failed to get track');
      Object.setPrototypeOf(err, SpotifyError.prototype);
      throw err;
    }
  }

  async getPlaylist(playlistId: string): Promise<Playlist> {
    try {
      const api = await this.getApi();
      const playlist = await api.playlists.getPlaylist(playlistId);
      const tracks = await api.playlists.getPlaylistItems(playlistId);

      const formattedTracks = tracks.items
        .filter((item) => item.track?.type === 'track')
        .map((item) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          previewUrl: item.track.preview_url,
        }));

      const formattedPlaylist = {
        id: playlist.id,
        name: playlist.name,
        tracks: formattedTracks,
      };

      return PlaylistSchema.parse(formattedPlaylist);
    } catch (error) {
      const err = new SpotifyError(
        error instanceof Error ? error.message : 'Failed to get playlist',
      );
      Object.setPrototypeOf(err, SpotifyError.prototype);
      throw err;
    }
  }
}
