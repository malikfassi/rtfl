import { setupIntegrationTest, type IntegrationTestContext, cleanupIntegrationTest } from '@/lib/test/test-env/integration';
import { spotifyData } from '@/lib/test/fixtures/spotify';
import { getLyrics } from '@/lib/test/fixtures/lyrics';
import { ValidationError } from '@/lib/errors/base';
import { MissingTrackIdError } from '@/lib/errors/spotify';

describe('SongService Integration', () => {
  let context: IntegrationTestContext;
  const trackId = Object.keys(spotifyData.tracks)[0];
  const track = spotifyData.tracks[trackId];

  beforeEach(async () => {
    // Setup integration test context with clean database
    context = await setupIntegrationTest();
  });

  afterEach(async () => {
    // Cleanup test context and database
    await cleanupIntegrationTest();
  });

  describe('create', () => {
    test('creates song with lyrics', async () => {
      const { songService } = context;
      const song = await songService.create(trackId);

      expect(song).toEqual(expect.objectContaining({
        id: expect.any(String),
        spotifyId: trackId,
        spotifyData: track,
        geniusData: expect.objectContaining({
          search: expect.objectContaining({
            response: expect.objectContaining({
              hits: expect.any(Array)
            })
          })
        }),
        lyrics: getLyrics(trackId),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }));
    });

    test('throws ValidationError when track ID is empty', async () => {
      const { songService } = context;
      await expect(songService.create(''))
        .rejects
        .toThrow(new ValidationError('Spotify ID is required'));
    });

    test('throws ValidationError when track ID is only whitespace', async () => {
      const { songService } = context;
      await expect(songService.create('   '))
        .rejects
        .toThrow(new ValidationError('Spotify ID is required'));
    });

    test('throws MissingTrackIdError when track ID is invalid', async () => {
      const { songService } = context;
      await expect(songService.create('invalid-id'))
        .rejects
        .toThrow(new MissingTrackIdError());
    });
  });
}); 