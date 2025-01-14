import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SpotifyClient } from './client';
import { SpotifyError } from '../errors';
import { resetSpotifyApi, getSpotifyApi } from './auth';

jest.mock('@spotify/web-api-ts-sdk');
jest.mock('./auth');

describe('SpotifyClient', () => {
  let mockSpotifyApi: jest.Mocked<SpotifyApi>;
  let client: SpotifyClient;

  beforeEach(() => {
    mockSpotifyApi = {
      search: jest.fn(),
      playlists: {
        getPlaylistItems: jest.fn(),
        getPlaylist: jest.fn(),
        changePlaylistDetails: jest.fn(),
        movePlaylistItems: jest.fn(),
        updatePlaylistItems: jest.fn(),
      },
      tracks: {
        get: jest.fn(),
      },
    } as unknown as jest.Mocked<SpotifyApi>;

    (getSpotifyApi as jest.Mock).mockResolvedValue(mockSpotifyApi);
    client = new SpotifyClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetSpotifyApi();
  });

  describe('searchPlaylist', () => {
    it('returns formatted results', async () => {
      const mockSearchResponse = {
        playlists: {
          items: [
            {
              id: '1',
              name: 'Test Playlist',
            },
          ],
        },
      };

      const mockPlaylistTracksResponse = {
        items: [
          {
            track: {
              id: 'track1',
              name: 'Test Track',
              type: 'track',
              artists: [{ name: 'Test Artist' }],
              preview_url: 'test-preview-url',
            },
          },
        ],
      };

      (mockSpotifyApi.search as jest.Mock).mockResolvedValue(mockSearchResponse);
      (mockSpotifyApi.playlists.getPlaylistItems as jest.Mock).mockResolvedValue(
        mockPlaylistTracksResponse,
      );

      const results = await client.searchPlaylist('test');

      expect(results).toEqual([
        {
          id: '1',
          name: 'Test Playlist',
          tracks: [
            {
              id: 'track1',
              name: 'Test Track',
              artist: 'Test Artist',
              previewUrl: 'test-preview-url',
            },
          ],
        },
      ]);
    });

    it('throws error when search fails', async () => {
      (mockSpotifyApi.search as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(client.searchPlaylist('test')).rejects.toThrow(SpotifyError);
    });
  });

  describe('getTrack', () => {
    it('returns formatted track', async () => {
      const mockResponse = {
        id: '1',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        preview_url: 'test-preview-url',
      };

      (mockSpotifyApi.tracks.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.getTrack('test-id');

      expect(result).toEqual({
        id: '1',
        name: 'Test Track',
        artist: 'Test Artist',
        previewUrl: 'test-preview-url',
      });
    });

    it('throws error when fetch fails', async () => {
      (mockSpotifyApi.tracks.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(client.getTrack('test-id')).rejects.toThrow(SpotifyError);
    });
  });

  describe('getPlaylist', () => {
    it('returns formatted playlist', async () => {
      const mockPlaylistResponse = {
        id: '1',
        name: 'Test Playlist',
      };

      const mockTracksResponse = {
        items: [
          {
            track: {
              id: 'track1',
              name: 'Test Track',
              type: 'track',
              artists: [{ name: 'Test Artist' }],
              preview_url: 'test-preview-url',
            },
          },
        ],
      };

      (mockSpotifyApi.playlists.getPlaylist as jest.Mock).mockResolvedValue(mockPlaylistResponse);
      (mockSpotifyApi.playlists.getPlaylistItems as jest.Mock).mockResolvedValue(
        mockTracksResponse,
      );

      const result = await client.getPlaylist('test-id');

      expect(result).toEqual({
        id: '1',
        name: 'Test Playlist',
        tracks: [
          {
            id: 'track1',
            name: 'Test Track',
            artist: 'Test Artist',
            previewUrl: 'test-preview-url',
          },
        ],
      });
    });

    it('throws error when fetch fails', async () => {
      (mockSpotifyApi.playlists.getPlaylist as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(client.getPlaylist('test-id')).rejects.toThrow(SpotifyError);
    });
  });
});
