import { SpotifyClientImpl, SpotifyClient } from '../spotify';
import { SpotifyApiError, PlaylistNotFoundError, TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { setupUnitTest, cleanupUnitTest } from '@/app/api/lib/test/env/unit';
import type { UnitTestContext } from '@/app/api/lib/test/env/unit';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { constructSpotifySearchQuery } from '@/app/api/lib/utils/spotify';
import { TEST_IDS, getErrorCaseKeyById, TRACK_KEYS, PLAYLIST_KEYS, TRACK_URIS } from '@/app/api/lib/test/constants';

// Helper function to extract Spotify ID from URI
function extractSpotifyId(uri: string): string {
  const parts = uri.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid Spotify URI format: ${uri}`);
  }
  return parts[2];
}

describe('SpotifyClient', () => {
  let client: SpotifyClientImpl;
  let context: UnitTestContext;

  beforeEach(() => {
    context = setupUnitTest();
    client = new SpotifyClientImpl('test-client-id', 'test-client-secret', context.mockSpotifyClient);
  });

  afterEach(() => {
    cleanupUnitTest();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use provided credentials', () => {
      const clientId = 'custom-client-id';
      const clientSecret = 'custom-client-secret';
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
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const uri = TRACK_URIS[key];
      const spotifyId = extractSpotifyId(uri);
      const track = await client.getTrack(spotifyId);
      context.validator.spotify_client.track(track, key);
      expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith(spotifyId);
    });

    it('should throw TrackNotFoundError for non-existent track', async () => {
      context.mockSpotifyClient.getTrack.mockRejectedValueOnce(new TrackNotFoundError());
      await expect(client.getTrack('non-existent')).rejects.toThrow(TrackNotFoundError);
      expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith('non-existent');
    });

    it('should throw SpotifyApiError for API failures', async () => {
      context.mockSpotifyClient.getTrack.mockRejectedValueOnce(new SpotifyApiError(new Error('API Error')));
      await expect(client.getTrack('error')).rejects.toThrow(SpotifyApiError);
      expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith('error');
    });

    it('should throw for NOT_FOUND track', async () => {
      const id = TEST_IDS.SPOTIFY.ERROR_CASES.NOT_FOUND;
      context.mockSpotifyClient.getTrack.mockRejectedValueOnce(new Error('Track not found'));
      await expect(client.getTrack(id)).rejects.toThrow('Track not found');
    });

    it('should throw for INVALID_FORMAT track', async () => {
      const id = TEST_IDS.SPOTIFY.ERROR_CASES.INVALID_FORMAT;
      context.mockSpotifyClient.getTrack.mockRejectedValueOnce(new Error('Invalid id'));
      await expect(client.getTrack(id)).rejects.toThrow('Invalid id');
    });
  });

  describe('searchTracks', () => {
    it('should return tracks for valid query', async () => {
      const trackId = context.constants.ids.SPOTIFY.TRACKS.WITH_LYRICS.PARTY_IN_THE_USA;
      const tracks = await client.searchTracks(trackId);
      context.validator.spotify_client.search(tracks, trackId);
      expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith(trackId);
    });

    it('should throw SpotifyApiError for API failures', async () => {
      context.mockSpotifyClient.searchTracks.mockRejectedValueOnce(new SpotifyApiError(new Error('API Error')));
      await expect(client.searchTracks('error')).rejects.toThrow(SpotifyApiError);
      expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith('error');
    });
  });

  describe('searchPlaylists', () => {
    it('should return playlists for valid query', async () => {
      const playlistId = PLAYLIST_KEYS.ROCK_CLASSICS;
      const playlists = await client.searchPlaylists(playlistId);
      context.validator.spotify_client.playlist_search(playlists, playlistId);
      expect(context.mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith(playlistId);
    });

    it('should throw SpotifyApiError for API failures', async () => {
      context.mockSpotifyClient.searchPlaylists.mockRejectedValueOnce(new SpotifyApiError(new Error('API Error')));
      await expect(client.searchPlaylists('error')).rejects.toThrow(SpotifyApiError);
      expect(context.mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith('error');
    });
  });

  describe('getPlaylistTracks', () => {
    it('should return tracks for valid playlist id', async () => {
      const id = context.constants.ids.SPOTIFY.PLAYLISTS.ROCK_CLASSICS;
      const tracks = await client.getPlaylistTracks(id);
      context.validator.spotify_client.playlist_tracks(tracks, id);
      expect(context.mockSpotifyClient.getPlaylistTracks).toHaveBeenCalledWith(id);
    });

    it('should throw PlaylistNotFoundError for non-existent playlist', async () => {
      context.mockSpotifyClient.getPlaylistTracks.mockRejectedValueOnce(new PlaylistNotFoundError('non-existent'));
      await expect(client.getPlaylistTracks('non-existent')).rejects.toThrow(PlaylistNotFoundError);
      expect(context.mockSpotifyClient.getPlaylistTracks).toHaveBeenCalledWith('non-existent');
    });

    it('should throw SpotifyApiError for API failures', async () => {
      context.mockSpotifyClient.getPlaylistTracks.mockRejectedValueOnce(new SpotifyApiError(new Error('API Error')));
      await expect(client.getPlaylistTracks('error')).rejects.toThrow(SpotifyApiError);
      expect(context.mockSpotifyClient.getPlaylistTracks).toHaveBeenCalledWith('error');
    });
  });
}); 