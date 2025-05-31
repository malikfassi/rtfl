import { ValidationError } from '@/app/api/lib/errors/base';
import { TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/services/genius';
import {
  cleanupIntegrationTest,
  setupIntegrationTest,
  IntegrationTestContext
} from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS, TRACK_URIS, TEST_IDS } from '@/app/api/lib/test/constants';
import { SongService } from '../song';
import { spotifyService } from '../spotify';
import { geniusService } from '../genius';
import { lyricsService } from '../lyrics';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';

describe('SongService Integration', () => {
  let context: IntegrationTestContext;
  let songService: SongService;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
    
    // Create SongService with real database but mocked external services
    songService = new SongService(context.prisma, spotifyService, geniusService);
    
    // Mock external API calls to use fixture data
    jest.spyOn(geniusService, 'findMatch').mockImplementation(async (title: string, artist: string) => {
      // Return fixture data based on the track
      if (title.toLowerCase().includes('party') && artist.toLowerCase().includes('miley')) {
        return fixtures.genius.search.PARTY_IN_THE_USA.response.hits[0];
      }
      if (title.toLowerCase().includes('vie en rose')) {
        return fixtures.genius.search.LA_VIE_EN_ROSE.response.hits[0];
      }
      throw new NoMatchingLyricsError();
    });
    
    jest.spyOn(lyricsService, 'getLyrics').mockImplementation(async (url: string) => {
      // Return fixture lyrics based on URL
      if (url.includes('party-in-the-usa')) {
        return fixtures.genius.lyrics.PARTY_IN_THE_USA || 'Mock Party in the USA lyrics';
      }
      if (url.includes('la-vie-en-rose')) {
        return fixtures.genius.lyrics.LA_VIE_EN_ROSE || 'Mock La Vie en Rose lyrics';
      }
      return 'Mock lyrics content';
    });
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
    jest.restoreAllMocks();
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
      
      // Mock genius service to throw NoMatchingLyricsError for instrumental
      jest.spyOn(geniusService, 'findMatch').mockRejectedValueOnce(new NoMatchingLyricsError());
      
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