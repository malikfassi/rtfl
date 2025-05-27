import { SpotifyClientImpl, SpotifyClient } from '../spotify';
import { SpotifyApiError, PlaylistNotFoundError, TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { setupUnitTest, cleanupUnitTest } from '@/app/api/lib/test/env/unit';
import type { UnitTestContext } from '@/app/api/lib/test/env/unit';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { constructSpotifySearchQuery } from '@/app/api/lib/utils/spotify';

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
      const id = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = await client.getTrack(id);
      context.validator.spotify_client.track(track, id);
      expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith(id);
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
  });

  describe('searchTracks', () => {
    it('should return tracks for valid query', async () => {
      const trackId = context.constants.ids.SPOTIFY.TRACKS.PARTY_IN_THE_USA;
      const track = fixtures.spotify.getTrack.get(trackId);
      const query = constructSpotifySearchQuery(track.name, track.artists[0].name);
      const tracks = await client.searchTracks(query);
      context.validator.spotify_client.search(tracks, query);
      expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith(query);
    });

    it('should throw SpotifyApiError for API failures', async () => {
      context.mockSpotifyClient.searchTracks.mockRejectedValueOnce(new SpotifyApiError(new Error('API Error')));
      await expect(client.searchTracks('error')).rejects.toThrow(SpotifyApiError);
      expect(context.mockSpotifyClient.searchTracks).toHaveBeenCalledWith('error');
    });
  });

  describe('searchPlaylists', () => {
    it('should return playlists for valid query', async () => {
      const playlistId = context.constants.ids.SPOTIFY.PLAYLISTS.ROCK_CLASSICS;
      const playlist = fixtures.spotify.getPlaylist.get(playlistId);
      const query = playlist.name;
      const playlists = await client.searchPlaylists(query);
      context.validator.spotify_client.playlist_search(playlists, query);
      expect(context.mockSpotifyClient.searchPlaylists).toHaveBeenCalledWith(query);
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