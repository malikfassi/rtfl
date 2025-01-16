import { createSongService } from '../song';
import { spotifyClient } from '../../clients/spotify';
import { geniusClient } from '../../clients/genius';
import { createTestSong } from '../../test/helpers';
import { prisma } from '../../db';

jest.mock('../../clients/spotify');
jest.mock('../../clients/genius');

describe('SongService', () => {
  const songService = createSongService();

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
  });

  describe('getOrCreate', () => {
    it('should create a new song if it does not exist', async () => {
      const spotifyId = 'test-song-1';
      const mockTrack = {
        id: spotifyId,
        name: 'Test Song',
        artists: [{ name: 'Test Artist' }],
        preview_url: 'https://test.com/preview.mp3',
      };

      (spotifyClient.getPlaylistTracks as jest.Mock).mockResolvedValue({
        tracks: [mockTrack],
      });
      (geniusClient.searchSong as jest.Mock).mockResolvedValue('Test lyrics\nSecond line\nThird line');

      const result = await songService.getOrCreate(spotifyId);

      expect(result).toBeDefined();
      expect(result.spotifyId).toBe(spotifyId);
      expect(spotifyClient.getPlaylistTracks).toHaveBeenCalledWith(spotifyId);
      expect(geniusClient.searchSong).toHaveBeenCalledWith('Test Song', 'Test Artist');
    });

    it('should return existing song if it exists', async () => {
      const existingSong = await createTestSong();

      const result = await songService.getOrCreate(existingSong.spotifyId);

      expect(result.id).toBe(existingSong.id);
      expect(spotifyClient.getPlaylistTracks).not.toHaveBeenCalled();
      expect(geniusClient.searchSong).not.toHaveBeenCalled();
    });
  });
}); 