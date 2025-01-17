import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { SongService } from '../song';
import { geniusClient } from '@/lib/clients/genius';

jest.mock('@/lib/clients/genius', () => ({
  geniusClient: {
    searchSong: jest.fn()
  }
}));

describe('SongService', () => {
  let prismaMock: DeepMockProxy<PrismaClient>;
  let songService: SongService;
  
  const mockSong = {
    id: '1',
    spotifyId: 'spotify123',
    title: 'Test Song',
    artist: 'Test Artist',
    lyrics: 'Test lyrics',
    previewUrl: null,
    maskedLyrics: {
      title: ['Test', 'Song'],
      artist: ['Test', 'Artist'],
      lyrics: ['Test', 'lyrics']
    },
    createdAt: new Date('2025-01-17T09:19:20.784Z'),
    updatedAt: new Date('2025-01-17T09:19:20.784Z')
  };

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    songService = new SongService(prismaMock);

    // Mock geniusClient.searchSong
    (geniusClient.searchSong as jest.Mock).mockResolvedValue('Test lyrics');
  });

  describe('getOrCreate', () => {
    it('should create a new song if one does not exist', async () => {
      prismaMock.song.findFirst.mockResolvedValue(null);
      prismaMock.song.create.mockResolvedValue(mockSong);
      
      const result = await songService.getOrCreate('spotify123', 'Test Song', 'Test Artist');
      expect(result).toEqual(mockSong);
      expect(geniusClient.searchSong).toHaveBeenCalledWith('Test Song', 'Test Artist');
      expect(prismaMock.song.create).toHaveBeenCalledWith({
        data: {
          spotifyId: 'spotify123',
          title: 'Test Song',
          artist: 'Test Artist',
          lyrics: 'Test lyrics',
          maskedLyrics: expect.objectContaining({
            title: expect.any(Array),
            artist: expect.any(Array),
            lyrics: expect.any(Array)
          })
        }
      });
    });

    it('should return existing song if one exists', async () => {
      prismaMock.song.findFirst.mockResolvedValue(mockSong);
      
      const result = await songService.getOrCreate('spotify123', 'Test Song', 'Test Artist');
      expect(result).toEqual(mockSong);
      expect(prismaMock.song.findFirst).toHaveBeenCalledWith({
        where: { spotifyId: 'spotify123' }
      });
      expect(geniusClient.searchSong).not.toHaveBeenCalled();
    });

    it('should throw an error if required parameters are missing', async () => {
      await expect(songService.getOrCreate('', '', '')).rejects.toThrow('Invalid input parameters');
    });

    it('should throw an error if lyrics cannot be found', async () => {
      prismaMock.song.findFirst.mockResolvedValue(null);
      (geniusClient.searchSong as jest.Mock).mockRejectedValue(new Error('No lyrics found'));
      
      await expect(songService.getOrCreate('spotify123', 'Test Song', 'Test Artist')).rejects.toThrow('No lyrics found');
    });
  });
}); 