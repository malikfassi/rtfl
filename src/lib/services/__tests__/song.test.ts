import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SongService } from '../song';
import { spotifyClient } from '@/lib/clients/spotify';
import { geniusClient } from '@/lib/clients/genius';
import { mockSpotifyTrackData, mockGeniusData } from '@/lib/test/utils';

const mockSong = {
  id: '1',
  spotifyId: 'spotify123',
  spotifyData: JSON.parse(JSON.stringify(mockSpotifyTrackData)) as Prisma.JsonValue,
  geniusData: JSON.parse(JSON.stringify(mockGeniusData)) as Prisma.JsonValue,
  lyrics: 'Test lyrics',
  maskedLyrics: {
    title: ['Test', 'Song'],
    artist: ['Test', 'Artist'],
    lyrics: ['Test', 'lyrics']
  } as Prisma.JsonValue,
  createdAt: new Date('2025-01-17T09:19:20.784Z'),
  updatedAt: new Date('2025-01-17T09:19:20.784Z')
};

jest.mock('@/lib/clients/genius', () => ({
  geniusClient: {
    searchSong: jest.fn()
  }
}));

jest.mock('@/lib/clients/spotify', () => ({
  spotifyClient: {
    getTrack: jest.fn()
  }
}));

describe('SongService', () => {
  let songService: SongService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = mockDeep<PrismaClient>();
    songService = new SongService(prismaMock);
  });

  describe('create', () => {
    it('should create a new song', async () => {
      const mockSpotifyTrack = mockSpotifyTrackData;
      const mockGeniusResult = {
        lyrics: 'Test lyrics',
        data: mockGeniusData
      };

      // Mock Spotify API call
      (spotifyClient.getTrack as jest.Mock).mockResolvedValue(mockSpotifyTrack);
      // Mock Genius API call
      (geniusClient.searchSong as jest.Mock).mockResolvedValue(mockGeniusResult);

      prismaMock.song.create.mockResolvedValue(mockSong);

      const result = await songService.create('spotify123');
      expect(result).toEqual(mockSong);

      expect(spotifyClient.getTrack).toHaveBeenCalledWith('spotify123');
      expect(geniusClient.searchSong).toHaveBeenCalledWith(
        mockSpotifyTrack.name,
        mockSpotifyTrack.artists[0].name
      );
    });

    it('should throw an error if track is not found', async () => {
      (spotifyClient.getTrack as jest.Mock).mockResolvedValue(null);

      await expect(songService.create('')).rejects.toThrow('Track not found');
    });

    it('should throw an error if lyrics are not found', async () => {
      const mockSpotifyTrack = mockSpotifyTrackData;
      (spotifyClient.getTrack as jest.Mock).mockResolvedValue(mockSpotifyTrack);
      (geniusClient.searchSong as jest.Mock).mockRejectedValue(new Error('GeniusError'));

      await expect(songService.create('spotify123')).rejects.toThrow(
        'Failed to fetch lyrics for "Test Song" by "Test Artist" - GeniusError'
      );
    });
  });
}); 