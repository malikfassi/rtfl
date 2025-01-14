import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SpotifyClient } from './client';
import { SpotifyError } from '../errors';
import { resetSpotifyApi } from './auth';

// Mock environment variables
const env = process.env;
beforeAll(() => {
  process.env = {
    ...env,
    SPOTIFY_CLIENT_ID: 'test-client-id',
    SPOTIFY_CLIENT_SECRET: 'test-client-secret',
  };
});

afterAll(() => {
  process.env = env;
});

// Mock the Spotify SDK
jest.mock('@spotify/web-api-ts-sdk');

describe('SpotifyClient', () => {
  let client: SpotifyClient;
  let mockSpotifyApi: jest.Mocked<Partial<SpotifyApi>>;

  beforeEach(() => {
    resetSpotifyApi();
    client = new SpotifyClient();
    mockSpotifyApi = {
      authenticate: jest.fn(),
      search: jest.fn(),
      playlists: {
        getPlaylist: jest.fn(),
        getPlaylistItems: jest.fn(),
      },
      tracks: {
        get: jest.fn(),
      },
    } as unknown as jest.Mocked<Partial<SpotifyApi>>;

    (SpotifyApi.withClientCredentials as jest.Mock).mockReturnValue(mockSpotifyApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPlaylist', () => {
    it('should search playlists and return formatted results', async () => {
      const mockPlaylist = {
        id: 'playlist1',
        name: 'Test Playlist',
      };

      const mockTracks = {
        items: [
          {
            track: {
              id: 'track1',
              type: 'track',
              name: 'Test Track',
              artists: [{ name: 'Test Artist' }],
              preview_url: 'https://example.com/preview',
            },
          },
        ],
      };

      (mockSpotifyApi.search as jest.Mock).mockResolvedValue({
        playlists: { items: [mockPlaylist] },
      });
      (mockSpotifyApi.playlists?.getPlaylistItems as jest.Mock).mockResolvedValue(mockTracks);

      const result = await client.searchPlaylist('test');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'playlist1',
        name: 'Test Playlist',
        tracks: [
          {
            id: 'track1',
            name: 'Test Track',
            artist: 'Test Artist',
            previewUrl: 'https://example.com/preview',
          },
        ],
      });
    });

    it('should handle search errors', async () => {
      (mockSpotifyApi.search as jest.Mock).mockRejectedValue(new Error('API Error'));

      let error;
      try {
        await client.searchPlaylist('test');
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(SpotifyError);
    });
  });

  describe('getTrack', () => {
    it('should get track and return formatted result', async () => {
      const mockTrack = {
        id: 'track1',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        preview_url: 'https://example.com/preview',
      };

      (mockSpotifyApi.tracks?.get as jest.Mock).mockResolvedValue(mockTrack);

      const result = await client.getTrack('track1');

      expect(result).toEqual({
        id: 'track1',
        name: 'Test Track',
        artist: 'Test Artist',
        previewUrl: 'https://example.com/preview',
      });
    });

    it('should handle track fetch errors', async () => {
      (mockSpotifyApi.tracks?.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      let error;
      try {
        await client.getTrack('track1');
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(SpotifyError);
    });
  });

  describe('getPlaylist', () => {
    it('should get playlist and return formatted result', async () => {
      const mockPlaylist = {
        id: 'playlist1',
        name: 'Test Playlist',
      };

      const mockTracks = {
        items: [
          {
            track: {
              id: 'track1',
              type: 'track',
              name: 'Test Track',
              artists: [{ name: 'Test Artist' }],
              preview_url: 'https://example.com/preview',
            },
          },
        ],
      };

      (mockSpotifyApi.playlists?.getPlaylist as jest.Mock).mockResolvedValue(mockPlaylist);
      (mockSpotifyApi.playlists?.getPlaylistItems as jest.Mock).mockResolvedValue(mockTracks);

      const result = await client.getPlaylist('playlist1');

      expect(result).toEqual({
        id: 'playlist1',
        name: 'Test Playlist',
        tracks: [
          {
            id: 'track1',
            name: 'Test Track',
            artist: 'Test Artist',
            previewUrl: 'https://example.com/preview',
          },
        ],
      });
    });

    it('should handle playlist fetch errors', async () => {
      (mockSpotifyApi.playlists?.getPlaylist as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      let error;
      try {
        await client.getPlaylist('playlist1');
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(SpotifyError);
    });
  });
});
