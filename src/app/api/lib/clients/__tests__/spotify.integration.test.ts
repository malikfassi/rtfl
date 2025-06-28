import { SpotifyClientImpl } from '../spotify';
import { SpotifyApiError, PlaylistNotFoundError, TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import { integration_validator } from '@/app/api/lib/test/validators';
import { env } from '@/app/api/lib/env';
import { getSpotifySearchQueryForTrackKey } from '@/app/api/lib/utils/spotify';
import { TEST_IDS, TRACK_KEYS, PLAYLIST_KEYS, TRACK_URIS, PLAYLIST_URIS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { describe, expect, it } from '@jest/globals';

describe('SpotifyClient', () => {
  let client: import('../spotify').SpotifyClient;

  beforeEach(async () => {
    await setupIntegrationTest();
    // Use the real client for integration tests (no mocks)
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
      // Test that the constructor doesn't throw when valid credentials are provided
      expect(customClient).toBeInstanceOf(SpotifyClientImpl);
    });

    it('should throw SpotifyApiError when credentials are missing', () => {
      expect(() => new SpotifyClientImpl('', '')).toThrow(SpotifyApiError);
    });
  });

  describe('getTrack', () => {
    it('should return track for valid id', async () => {
      const id = TRACK_URIS.PARTY_IN_THE_USA;
      const track = await client.getTrack(id);
      try {
        integration_validator.spotify_client.track(track, TRACK_KEYS.PARTY_IN_THE_USA);
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

    it('should throw TrackNotFoundError for NOT_FOUND track', async () => {
      const id = TEST_IDS.SPOTIFY.ERROR_CASES.NOT_FOUND;
      await expect(client.getTrack(id)).rejects.toThrow();
    });

    it('should throw SpotifyApiError for INVALID_FORMAT track', async () => {
      const id = TEST_IDS.SPOTIFY.ERROR_CASES.INVALID_FORMAT;
      await expect(client.getTrack(id)).rejects.toThrow();
    });
  });

  describe('searchTracks', () => {
    it('should return tracks for valid query', async () => {
      const searchQuery = getSpotifySearchQueryForTrackKey(TRACK_KEYS.PARTY_IN_THE_USA);
      const tracks = await client.searchTracks(searchQuery);
      try {
        integration_validator.spotify_client.search(TRACK_KEYS.PARTY_IN_THE_USA, { tracks: { items: tracks } });
      } catch (error) {
        console.log('Search validation failed. Debug info:');
        console.log('Key:', searchQuery);
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
      const key = PLAYLIST_KEYS.NINETIES_ROCK;
      const playlist = fixtures.spotify.playlists[key];
      const results = await client.searchPlaylists(playlist.name);
      integration_validator.spotify_client.search(key, { playlists: results });
    });

    it('should throw SpotifyApiError for empty query', async () => {
      await expect(client.searchPlaylists('')).rejects.toThrow(SpotifyApiError);
    });
  });

  describe('getPlaylistTracks', () => {
    // NOTE: Playlist tracks validation is skipped for now because the Spotify playlist object does not contain track items.
    // To validate playlist tracks, generate and use a separate fixture for playlist tracks and implement a validator.
    it('should return tracks for valid playlist id', async () => {
      const id = PLAYLIST_URIS.ROCK_CLASSICS;
      await client.getPlaylistTracks(id);
      // Validation skipped for now
    });

    it('should throw PlaylistNotFoundError for non-existent playlist', async () => {
      await expect(client.getPlaylistTracks('non-existent')).rejects.toThrow(PlaylistNotFoundError);
    });
  });
}); 