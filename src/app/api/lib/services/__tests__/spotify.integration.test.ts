import { createSpotifyService } from '../spotify';
import { TrackNotFoundError } from '@/app/api/lib/errors/clients/spotify';
import { ValidationError } from '@/app/api/lib/errors/base';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS, TRACK_URIS } from '@/app/api/lib/test/constants';
import { integration_validator } from '@/app/api/lib/test/validators';

describe('SpotifyService Integration', () => {
  let spotifyService: ReturnType<typeof createSpotifyService>;

  beforeEach(async () => {
    await setupIntegrationTest();
    spotifyService = createSpotifyService();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('getTrack', () => {
    it('should return track data for valid Spotify track ID', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const trackId = TRACK_URIS[key];
      const track = await spotifyService.getTrack(trackId);
      
      integration_validator.spotify_service.getTrack(key, track);
    });

    it('should throw TrackNotFoundError for non-existent track', async () => {
      const key = TRACK_KEYS.NOT_FOUND;
      const trackId = TRACK_URIS[key];
      await expect(spotifyService.getTrack(trackId))
        .rejects
        .toThrow(TrackNotFoundError);
    });

    it('should throw ValidationError for invalid track ID format', async () => {
      const key = TRACK_KEYS.INVALID_FORMAT;
      const trackId = TRACK_URIS[key];
      await expect(spotifyService.getTrack(trackId))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for empty track ID', async () => {
      await expect(spotifyService.getTrack(''))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('searchTracks', () => {
    it('should return tracks for valid search query', async () => {
      const key = TRACK_KEYS.PARTY_IN_THE_USA;
      const query = key;
      const tracks = await spotifyService.searchTracks(query);
      
      integration_validator.spotify_service.searchTracks(key, tracks);
    });

    it('should throw ValidationError for empty search query', async () => {
      await expect(spotifyService.searchTracks(''))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only search query', async () => {
      await expect(spotifyService.searchTracks('   '))
        .rejects
        .toThrow(ValidationError);
    });
  });
}); 