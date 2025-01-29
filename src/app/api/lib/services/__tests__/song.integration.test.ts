import { ValidationError } from '@/app/api/lib/errors/base';
import { NoMatchingLyricsError } from '@/app/api/lib/errors/clients/genius';
import { TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';
import { SONG_IDS } from '@/app/api/lib/test/fixtures/spotify_ids';
import {
  cleanupIntegrationTest,
  type IntegrationTestContext,
  setupIntegrationTest} from '@/app/api/lib/test/test-env/integration';

describe('SongService Integration', () => {
  let context: IntegrationTestContext;

  // Get test cases
  const validSongCase = TEST_CASES.SONGS.VALID;
  const frenchSongCase = TEST_CASES.SONGS.FRENCH;
  const unknownSongCase = TEST_CASES.SONGS.UNKNOWN_SONG;

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
  });

  describe('create', () => {
    it('creates a song with valid data', async () => {
      const { id } = validSongCase;
      const song = await context.songService.create(id);
      
      // Validate song using test case validators
      validSongCase.validators.unit.song(song);
      await validSongCase.validators.integration.song(song);
    });

    it('creates a song with French track data', async () => {
      const { id } = frenchSongCase;
      const song = await context.songService.create(id);

      frenchSongCase.validators.unit.song(song);
      await frenchSongCase.validators.integration.song(song);
    });

    it('throws TrackNotFoundError when track does not exist', async () => {
      const { id } = unknownSongCase;

      await expect(context.songService.create(id))
        .rejects
        .toThrow(TrackNotFoundError);
    });

    it('throws NoMatchingLyricsError for instrumental tracks', async () => {
      await expect(context.songService.create(SONG_IDS.INSTRUMENTAL_TRACK))
        .rejects
        .toThrow(NoMatchingLyricsError);
    });

    it('throws ValidationError when spotify ID is empty', async () => {
      await expect(context.songService.create(''))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.songService.create(''))
        .rejects
        .toThrow('Spotify ID is required');
    });

    it('throws ValidationError when spotify ID is only whitespace', async () => {
      await expect(context.songService.create('   '))
        .rejects
        .toThrow(ValidationError);
      
      await expect(context.songService.create('   '))
        .rejects
        .toThrow('Spotify ID is required');
    });
  });

  describe('searchTracks', () => {
    it('returns tracks when search is successful for valid song', async () => {
      const track = validSongCase.spotify.getTrack();
      const query = `${track.name} ${track.artists[0].name}`;

      const results = await context.songService.searchTracks(query);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify first result has expected track properties
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('name');
      expect(firstResult).toHaveProperty('artists');
    });

    it('returns tracks when search is successful for French song', async () => {
      const track = frenchSongCase.spotify.getTrack();
      const query = `${track.name} ${track.artists[0].name}`;

      const results = await context.songService.searchTracks(query);
      expect(results.length).toBeGreaterThan(0);
      
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('name');
      expect(firstResult).toHaveProperty('artists');
    });

    it('returns empty array when no tracks found', async () => {
      const results = await context.songService.searchTracks('completely unknown nonexistent song title');
      expect(results).toEqual([]);
    });

    it('throws ValidationError when query is empty', async () => {
      await expect(context.songService.searchTracks(''))
        .rejects
        .toThrow('Search query cannot be empty');
    });

    it('throws ValidationError when query is only whitespace', async () => {
      await expect(context.songService.searchTracks('   '))
        .rejects
        .toThrow('Search query cannot be empty');
    });
  });
});