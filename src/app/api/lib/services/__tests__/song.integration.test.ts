import { ValidationError } from '@/app/api/lib/errors/base';
import { TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import {
  cleanupIntegrationTest,
  setupIntegrationTest,
  IntegrationTestContext
} from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS, TRACK_URIS } from '@/app/api/lib/test/constants';
import { createSongService } from '../song';
import { createSpotifyService } from '../spotify';
import { createGeniusService } from '../genius';
import { integration_validator } from '@/app/api/lib/test/validators';

describe('SongService Integration', () => {
  let context: IntegrationTestContext;
  let songService: ReturnType<typeof createSongService>;
  let spotifyService: ReturnType<typeof createSpotifyService>;
  let geniusService: ReturnType<typeof createGeniusService>;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    
    // Create services with real dependencies
    spotifyService = createSpotifyService();
    geniusService = createGeniusService();
    songService = createSongService(context.prisma, spotifyService, geniusService);
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
  });

  describe('create', () => {
    it('creates a song with valid data', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackUri = TRACK_URIS[key];
      const trackId = trackUri.split(':').pop()!;
      const song = await songService.create(trackId);
      
      integration_validator.song_service.create(key, song);
      
      // Verify the song was actually saved to the database
      const savedSong = await context.prisma.song.findUnique({
        where: { id: song.id }
      });
      expect(savedSong).not.toBeNull();
      expect(savedSong?.spotifyId).toBe(trackId);
    });

    it('creates a song with French track data', async () => {
      const key = TRACK_KEYS.LA_VIE_EN_ROSE;
      const trackUri = TRACK_URIS[key];
      const trackId = trackUri.split(':').pop()!;
      const song = await songService.create(trackId);
      
      integration_validator.song_service.create(key, song);
      
      // Verify the song was actually saved to the database
      const savedSong = await context.prisma.song.findUnique({
        where: { id: song.id }
      });
      expect(savedSong).not.toBeNull();
      expect(savedSong?.spotifyId).toBe(trackId);
    });

    it('throws TrackNotFoundError when track does not exist', async () => {
      const key = TRACK_KEYS.NOT_FOUND;
      const trackUri = TRACK_URIS[key];
      const trackId = trackUri.split(':').pop()!;
      await expect(songService.create(trackId))
        .rejects
        .toThrow(TrackNotFoundError);
    });

    it('throws NoMatchingLyricsError when no Genius match found', async () => {
      const key = TRACK_KEYS.INSTRUMENTAL_TRACK;
      const trackUri = TRACK_URIS[key];
      const trackId = trackUri.split(':').pop()!;
      
      await expect(songService.create(trackId))
        .rejects
        .toThrow(NoMatchingLyricsError);
    });

    it('throws ValidationError when spotify ID is empty', async () => {
      await expect(songService.create(''))
        .rejects
        .toThrow(ValidationError);
    });

    it('throws ValidationError when spotify ID is only whitespace', async () => {
      await expect(songService.create('   '))
        .rejects
        .toThrow(ValidationError);
    });

    it('throws ValidationError when spotify ID format is invalid', async () => {
      const key = TRACK_KEYS.INVALID_FORMAT;
      const trackUri = TRACK_URIS[key];
      const invalidId = trackUri.split(':').pop()!;
      await expect(songService.create(invalidId))
        .rejects
        .toThrow(ValidationError);
    });
  });
});