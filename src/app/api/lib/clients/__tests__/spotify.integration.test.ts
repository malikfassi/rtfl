import { SpotifyClientImpl } from '../spotify';
import { SpotifyApiError, PlaylistNotFoundError, TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import type { IntegrationTestContext } from '@/app/api/lib/test/env/integration';
import { integration_validator } from '@/app/api/lib/test/validators';
import { env } from '@/app/api/lib/env';
import { constructSpotifySearchQuery } from '@/app/api/lib/utils/spotify';

describe('SpotifyClient', () => {
  let client: SpotifyClientImpl;
  let context: IntegrationTestContext;

  beforeEach(async () => {
    context = await setupIntegrationTest();
    client = new SpotifyClientImpl(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use provided credentials', () => {
      const clientId = env.SPOTIFY_CLIENT_ID;
      const clientSecret = env.SPOTIFY_CLIENT_SECRET;
      const customClient = new SpotifyClientImpl(clientId, clientSecret);
      expect((customClient as any).clientId).toBe(clientId);
      expect((customClient as any).clientSecret).toBe(clientSecret);
    });

    it('should throw SpotifyApiError when credentials are missing', () => {
      expect(() => new SpotifyClientImpl('', '')).toThrow(SpotifyApiError);
    });
  });

  describe('getTrack', () => {
    it('should return track for valid id', async () => {
      const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = await client.getTrack(id);
      try {
        integration_validator.spotify_client.track(track);
      } catch (error) {
        console.log('Track validation failed. Debug info:');
        console.log('Track ID:', id);
        console.log('Track:', JSON.stringify(track, null, 2));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should throw TrackNotFoundError for non-existent track', async () => {
      await expect(client.getTrack('1234567890123456789012')).rejects.toThrow(TrackNotFoundError);
    });
  });

  describe('searchTracks', () => {
    it('should return tracks for valid query', async () => {
      const trackId = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = context.fixtures.spotify.getTrack.get(trackId);
      const query = constructSpotifySearchQuery(track.name, track.artists[0].name);
      console.log('Search Query:', query);
      console.log('Reference Track:', {
        name: track.name,
        artist: track.artists[0].name
      });
      const tracks = await client.searchTracks(query);
      try {
        integration_validator.spotify_client.search(query, { tracks: { items: tracks } });
      } catch (error) {
        console.log('Search validation failed. Debug info:');
        console.log('Query:', query);
        console.log('Search Terms:', query.toLowerCase().split(' '));
        console.log('First Result:', {
          name: tracks[0].name,
          artists: tracks[0].artists.map(a => a.name)
        });
        console.log('All Results:', tracks.map(t => ({
          name: t.name,
          artists: t.artists.map(a => a.name)
        })));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should throw SpotifyApiError for empty query', async () => {
      await expect(client.searchTracks('')).rejects.toThrow(SpotifyApiError);
    });
  });

  describe('searchPlaylists', () => {
    it('should return playlists for valid query', async () => {
      const playlistId = context.constants.ids.SPOTIFY.PLAYLISTS.ROCK_CLASSICS;
      const playlist = context.fixtures.spotify.getPlaylist.get(playlistId);
      const query = playlist.name;
      const playlists = await client.searchPlaylists(query);
      try {
        integration_validator.spotify_client.search(query, { playlists: { items: playlists.items } });
      } catch (error) {
        console.log('Playlist search validation failed. Debug info:');
        console.log('Query:', query);
        console.log('Results:', JSON.stringify(playlists, null, 2));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should throw SpotifyApiError for empty query', async () => {
      await expect(client.searchPlaylists('')).rejects.toThrow(SpotifyApiError);
    });
  });

  describe('getPlaylistTracks', () => {
    it('should return tracks for valid playlist id', async () => {
      const id = context.constants.ids.SPOTIFY.PLAYLISTS.ROCK_CLASSICS;
      const tracks = await client.getPlaylistTracks(id);
      try {
        integration_validator.spotify_client.playlist_tracks(id, { items: tracks.map(track => ({ track })) });
      } catch (error) {
        console.log('Playlist tracks validation failed. Debug info:');
        console.log('Playlist ID:', id);
        console.log('Tracks:', JSON.stringify(tracks, null, 2));
        console.log('Error:', error);
        throw error;
      }
    });

    it('should throw PlaylistNotFoundError for non-existent playlist', async () => {
      await expect(client.getPlaylistTracks('non-existent')).rejects.toThrow(PlaylistNotFoundError);
    });
  });
}); 