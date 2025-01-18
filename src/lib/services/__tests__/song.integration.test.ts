import { prisma } from '@/lib/db';
import { createSongService } from '../song';
import { SongError } from '../song';
import { PARTY_IN_THE_U_S_A_, A_BAR_SONG } from '../../fixtures/songs';

describe('SongService Integration', () => {
  const songService = createSongService();

  afterEach(async () => {
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
  }, 10000);

  describe('create', () => {
    it('should create a song with lyrics and masked lyrics', async () => {
      const song = await songService.create(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(song).toBeDefined();
      expect(song.spotifyId).toBe(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(song.lyrics).toBeDefined();
      expect(song.maskedLyrics).toBeDefined();
    }, 10000);

    it('should throw SongError for non-existent Spotify track', async () => {
      await expect(songService.create('1234567890123456789012'))
        .rejects
        .toThrow(SongError);
      await expect(songService.create('1234567890123456789012'))
        .rejects
        .toMatchObject({
          code: 'SPOTIFY_NOT_FOUND',
          message: 'Track not found'
        });
    }, 10000);

    it('should handle songs with special characters', async () => {
      const song = await songService.create(A_BAR_SONG.spotifyId);
      expect(song).toBeDefined();
      expect(song.spotifyId).toBe(A_BAR_SONG.spotifyId);
      expect(song.lyrics).toBeDefined();
      expect(song.maskedLyrics).toBeDefined();
    }, 10000);
  });
}); 