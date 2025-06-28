import { SpotifyClient } from '@/app/api/lib/clients/spotify';
import { fixtures } from '../fixtures';
import { TRACK_URIS } from '../constants';

// Helper to get key from real Spotify ID
function getKeyFromSpotifyId(spotifyId: string): string | undefined {
  return Object.keys(TRACK_URIS).find(key => 
    TRACK_URIS[key as keyof typeof TRACK_URIS].split(':').pop() === spotifyId
  );
}

export class SpotifyMocks {
  static createClient(): jest.Mocked<SpotifyClient> {
    return {
      getTrack: jest.fn().mockImplementation((spotifyId: string) => {
        try {
          // Find key by real Spotify ID
          const key = getKeyFromSpotifyId(spotifyId);
          
          if (!key) {
            return Promise.reject(new Error(`Track not found: ${spotifyId}`));
          }
          
          const fixture = fixtures.spotify.tracks[key];
          if ('error' in fixture) {
            return Promise.reject(fixture.error);
          }
          return Promise.resolve(fixture);
        } catch (error) {
          return Promise.reject(new Error(`Track not found: ${spotifyId}`));
        }
      }),
      searchTracks: jest.fn().mockImplementation((key: string) => {
        try {
          return Promise.resolve(fixtures.spotify.search[key]?.tracks?.items || []);
        } catch (error) {
          return Promise.resolve([]);
        }
      }),
      searchPlaylists: jest.fn().mockImplementation((key: string) => {
        try {
          return Promise.resolve({ playlists: fixtures.spotify.search[key]?.playlists || { items: [] } });
        } catch (error) {
          return Promise.resolve({ playlists: { items: [] } });
        }
      }),
      getPlaylistTracks: jest.fn().mockImplementation((key: string) => {
        try {
          return Promise.resolve(fixtures.spotify.playlists[key]?.tracks.items.map(item => item.track) || []);
        } catch (error) {
          return Promise.resolve([]);
        }
      })
    } as jest.Mocked<SpotifyClient>;
  }
} 