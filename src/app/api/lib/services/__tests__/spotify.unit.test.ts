import { SpotifyService } from '../spotify';
import { unit_validator } from '@/app/api/lib/test/validators';
import { ValidationError } from '@/app/api/lib/errors/base';
import { SpotifyMocks } from '@/app/api/lib/test/mocks';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { TRACK_KEYS, TRACK_URIS } from '@/app/api/lib/test/constants';

// Helper function to extract Spotify ID from URI
function extractSpotifyId(uri: string): string {
  const parts = uri.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid Spotify URI format: ${uri}`);
  }
  return parts[2];
}

describe('SpotifyService Unit', () => {
  let service: SpotifyService;

  beforeEach(() => {
    service = new SpotifyService();
    // @ts-expect-error: override private
    service.spotifyClient = SpotifyMocks.createClient();
  });

  it('getTrack returns valid Track', async () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const uri = TRACK_URIS[key];
    const validId = extractSpotifyId(uri);
    const result = await service.getTrack(validId);
    unit_validator.spotify_service.getTrack(key, result);
    expect(result).toEqual(fixtures.spotify.tracks[key]);
  });

  it('getTrack throws ValidationError for invalid id', async () => {
    await expect(service.getTrack('')).rejects.toThrow(ValidationError);
  });

  it('searchTracks returns array of Track', async () => {
    const key = TRACK_KEYS.PARTY_IN_THE_USA;
    const result = await service.searchTracks(key);
    unit_validator.spotify_service.searchTracks(key, result);
    expect(result).toEqual(fixtures.spotify.search[key]?.tracks?.items || []);
  });

  it('searchTracks throws ValidationError for empty query', async () => {
    await expect(service.searchTracks('')).rejects.toThrow(ValidationError);
  });
}); 