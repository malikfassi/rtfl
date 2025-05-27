import { SpotifyClient } from '@/app/api/lib/clients/spotify';
import { fixtures } from '../fixtures';
import type { Track, Page, Playlist } from '@spotify/web-api-ts-sdk';

export class SpotifyMocks {
  static createClient(): jest.Mocked<SpotifyClient> {
    return {
      getTrack: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(fixtures.spotify.getTrack.get(id));
      }),
      searchTracks: jest.fn().mockImplementation((query: string) => {
        return Promise.resolve(fixtures.spotify.searchTracks.get(query));
      }),
      searchPlaylists: jest.fn().mockImplementation((query: string) => {
        return Promise.resolve(fixtures.spotify.searchPlaylists.get(query));
      }),
      getPlaylistTracks: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(fixtures.spotify.getPlaylistTracks.get(id));
      })
    } as jest.Mocked<SpotifyClient>;
  }
} 