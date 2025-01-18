import { prisma } from '@/lib/db';
import { createSongService } from '../song';
import { SongError } from '../song';
import { PARTY_IN_THE_U_S_A_, A_BAR_SONG } from '../../fixtures/songs';
import { Prisma } from '@prisma/client';

describe('SongService Integration', () => {
  const songService = createSongService();

  beforeEach(async () => {
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
  });

  afterEach(async () => {
    await prisma.game.deleteMany();
    await prisma.song.deleteMany();
  });

  describe('create', () => {
    it('should create a song with lyrics and masked lyrics', async () => {
      const song = await songService.create(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(song).toBeDefined();
      expect(song.spotifyId).toBe(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(song.lyrics).toBeDefined();
      expect(song.maskedLyrics).toBeDefined();
    }, 10000);

    it('should properly decode HTML entities in lyrics', async () => {
      const song = await songService.create(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(song.lyrics).not.toContain('&#x27;'); // Should not contain hex entities
      expect(song.lyrics).not.toContain('&#39;'); // Should not contain decimal entities
      expect(song.lyrics).toContain("'"); // Should contain decoded apostrophes
      expect(song.lyrics).toContain("I'm"); // Should contain decoded contractions
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

    it('should properly mask lyrics with accented characters', async () => {
      const mockLyrics = "J'ai mangé à côté de l'élève, il s'arrête à la forêt";
      const song = await prisma.song.create({
        data: {
          spotifyId: 'test-id',
          spotifyData: {},
          geniusData: {},
          lyrics: mockLyrics,
          maskedLyrics: songService['createMaskedLyrics']('Test Title', 'Test Artist', mockLyrics)
        }
      });

      const maskedLyrics = song.maskedLyrics as Prisma.JsonObject;
      console.log('Masked lyrics:', maskedLyrics.lyrics);
      console.log('Expected masked words:');
      console.log("_'__ for J'ai");
      console.log("_____ for mangé");
      console.log("_ for à");
      console.log("_'_____ for l'élève");
      console.log("_'______ for s'arrête");
      console.log("_ for à");
      console.log("_____ for forêt");
      console.log('Actual masked words:', JSON.stringify(maskedLyrics.lyrics, null, 2));

      expect((maskedLyrics.lyrics as string[]).some(word => word === "_'__")).toBe(true);  // J'ai
      expect((maskedLyrics.lyrics as string[]).some(word => word === "_____")).toBe(true);  // mangé
      expect((maskedLyrics.lyrics as string[]).some(word => word === "_")).toBe(true);  // à
      expect((maskedLyrics.lyrics as string[]).some(word => word === "_'_____")).toBe(true);  // l'élève
      expect((maskedLyrics.lyrics as string[]).some(word => word === "_'______")).toBe(true);  // s'arrête
      expect((maskedLyrics.lyrics as string[]).some(word => word === "_")).toBe(true);  // à
      expect((maskedLyrics.lyrics as string[]).some(word => word === "_____")).toBe(true);  // forêt
    });
  });
}); 