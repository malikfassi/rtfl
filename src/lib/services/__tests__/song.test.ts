import { createSongService } from '../song';
import { prisma } from '../../db';
import { spotifyClient } from '../../clients/spotify';
import { createTestSong } from '../../test/helpers';

jest.mock('../../clients/spotify', () => ({
  spotifyClient: {
    getTrack: jest.fn()
  }
}));

describe('SongService', () => {
  let songService: ReturnType<typeof createSongService>;

  beforeEach(async () => {
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
    songService = createSongService();
  });

  describe('getOrCreate', () => {
    it('should return existing song if it exists', async () => {
      const song = await createTestSong();
      const result = await songService.getOrCreate(song.spotifyId);
      expect(result.id).toBe(song.id);
    });

    it('should create a new song if it does not exist', async () => {
      const mockTrack = {
        id: 'spotify-123',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        preview_url: 'http://example.com/preview.mp3'
      };

      (spotifyClient.getTrack as jest.Mock).mockResolvedValue(mockTrack);

      const result = await songService.getOrCreate('spotify-123');

      expect(result.spotifyId).toBe('spotify-123');
      expect(result.title).toBe('Test Track');
      expect(result.artist).toBe('Test Artist');
      expect(result.previewUrl).toBe('http://example.com/preview.mp3');
    });
  });
}); 