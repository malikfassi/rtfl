import axios from 'axios';
import { GeniusClient } from './client';
import { GeniusError } from '../errors';
import { resetGeniusApiKey } from './auth';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variables
const env = process.env;
beforeAll(() => {
  process.env = {
    ...env,
    GENIUS_API_KEY: 'test-api-key',
  };
});

afterAll(() => {
  process.env = env;
});

describe('GeniusClient', () => {
  let client: GeniusClient;

  beforeEach(() => {
    resetGeniusApiKey();
    client = new GeniusClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchSongs', () => {
    it('should search songs and return formatted results', async () => {
      const mockSearchResponse = {
        data: {
          response: {
            hits: [
              {
                result: {
                  id: 1,
                  title: 'Test Song',
                  url: 'https://genius.com/test-song',
                  path: '/test-song-lyrics',
                  artist: {
                    id: 1,
                    name: 'Test Artist',
                  },
                  lyrics_state: 'complete',
                  primary_artist: {
                    id: 1,
                    name: 'Test Artist',
                  },
                },
              },
            ],
          },
        },
      };

      mockAxios.get.mockResolvedValueOnce(mockSearchResponse);

      const result = await client.searchSongs('test');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Test Song',
        url: 'https://genius.com/test-song',
        path: '/test-song-lyrics',
        artist: {
          id: 1,
          name: 'Test Artist',
        },
        lyrics_state: 'complete',
        primary_artist: {
          id: 1,
          name: 'Test Artist',
        },
      });

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.genius.com/search',
        expect.any(Object),
      );
    });

    it('should handle search errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('API Error'));

      let error;
      try {
        await client.searchSongs('test');
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(GeniusError);
    });
  });

  describe('getSongDetails', () => {
    it('should get song details and return formatted result', async () => {
      const mockResponse = {
        data: {
          response: {
            song: {
              id: 1,
              title: 'Test Song',
              url: 'https://genius.com/test-song',
              path: '/test-song-lyrics',
              artist: {
                id: 1,
                name: 'Test Artist',
              },
              lyrics_state: 'complete',
              primary_artist: {
                id: 1,
                name: 'Test Artist',
              },
              description: {
                plain: 'Test description',
              },
              embed_content: '<div>Test embed</div>',
              recording_location: 'Test Studio',
              release_date: '2024-01-14',
            },
          },
        },
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getSongDetails(1);

      expect(result).toEqual({
        id: 1,
        title: 'Test Song',
        url: 'https://genius.com/test-song',
        path: '/test-song-lyrics',
        artist: {
          id: 1,
          name: 'Test Artist',
        },
        lyrics_state: 'complete',
        primary_artist: {
          id: 1,
          name: 'Test Artist',
        },
        description: {
          plain: 'Test description',
        },
        embed_content: '<div>Test embed</div>',
        recording_location: 'Test Studio',
        release_date: '2024-01-14',
      });

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.genius.com/songs/1',
        expect.any(Object),
      );
    });

    it('should handle song details fetch errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('API Error'));

      let error;
      try {
        await client.getSongDetails(1);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(GeniusError);
    });
  });

  describe('getArtistSongs', () => {
    it('should get artist songs and return formatted results', async () => {
      const mockResponse = {
        data: {
          response: {
            songs: [
              {
                id: 1,
                title: 'Test Song',
                url: 'https://genius.com/test-song',
                path: '/test-song-lyrics',
                artist: {
                  id: 1,
                  name: 'Test Artist',
                },
                lyrics_state: 'complete',
                primary_artist: {
                  id: 1,
                  name: 'Test Artist',
                },
              },
            ],
          },
        },
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getArtistSongs(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Test Song',
        url: 'https://genius.com/test-song',
        path: '/test-song-lyrics',
        artist: {
          id: 1,
          name: 'Test Artist',
        },
        lyrics_state: 'complete',
        primary_artist: {
          id: 1,
          name: 'Test Artist',
        },
      });

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.genius.com/artists/1/songs',
        expect.any(Object),
      );
    });

    it('should handle artist songs fetch errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('API Error'));

      let error;
      try {
        await client.getArtistSongs(1);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(GeniusError);
    });
  });
});
