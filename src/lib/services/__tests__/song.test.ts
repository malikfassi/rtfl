import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupUnitTest, cleanupUnitTest, type UnitTestContext } from '@/lib/test';
import { NoMatchingLyricsError, LyricsExtractionError } from '@/lib/errors/genius';
import { NoMatchingTracksError } from '@/lib/errors/spotify';
import { TEST_CASES } from '@/lib/test/fixtures/core/test_cases';
import { SongService } from '@/lib/services/song';

// Get test cases
const [validSongCase, frenchSongCase, instrumentalCase] = Object.values(TEST_CASES.SONGS);

describe('Song Service', () => {
  let context: UnitTestContext;
  let service: SongService;

  beforeEach(() => {
    context = setupUnitTest();
    service = new SongService(
      context.mockPrisma,
      context.mockSpotifyClient,
      context.mockGeniusClient
    );
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('searchTracks', () => {
    test('returns tracks when search is successful for valid song', async () => {
      const { mockSpotifyClient } = context;
      const track = validSongCase.spotify.getTrack();
      const query = `${track.name} ${track.artists[0].name}`;

      mockSpotifyClient.searchTracks.mockResolvedValueOnce([track]);

      const result = await service.searchTracks(query);
      expect(result).toEqual([track]);
    });

    test('returns tracks when search is successful for French song', async () => {
      const { mockSpotifyClient } = context;
      const track = frenchSongCase.spotify.getTrack();
      const query = `${track.name} ${track.artists[0].name}`;

      mockSpotifyClient.searchTracks.mockResolvedValueOnce([track]);

      const result = await service.searchTracks(query);
      expect(result).toEqual([track]);
    });

    test('returns empty array when no tracks found', async () => {
      const { mockSpotifyClient } = context;
      mockSpotifyClient.searchTracks.mockRejectedValueOnce(new NoMatchingTracksError());

      const result = await service.searchTracks('unknown song');
      expect(result).toEqual([]);
    });

    test('handles other errors by passing them through', async () => {
      const { mockSpotifyClient } = context;
      mockSpotifyClient.searchTracks.mockRejectedValueOnce(new Error('Track not found'));

      await expect(service.searchTracks('unknown song')).rejects.toThrow('Track not found');
    });
  });

  describe('create', () => {
    test('creates song with valid data', async () => {
      const testCase = validSongCase;
      
      // Mock API responses
      context.mockSpotifyClient.getTrack.mockResolvedValueOnce(testCase.spotify.getTrack());
      context.mockGeniusClient.search.mockResolvedValueOnce(testCase.genius.getSearch());
      context.mockGeniusClient.getLyrics.mockResolvedValueOnce(testCase.lyrics.get());
      
      // Mock Prisma response
      context.mockPrisma.song.create.mockResolvedValueOnce(testCase.prisma.song.create.output('1'));

      const result = await service.create(testCase.id);

      // Use test case validator
      testCase.validators.unit.song(result);

      // Verify the mocks were called correctly
      expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith(testCase.id);
      expect(context.mockPrisma.song.create).toHaveBeenCalledWith(testCase.prisma.song.create.input());
    });

    test('creates song with French track data', async () => {
      const testCase = frenchSongCase;
      
      // Mock API responses
      context.mockSpotifyClient.getTrack.mockResolvedValueOnce(testCase.spotify.getTrack());
      context.mockGeniusClient.search.mockResolvedValueOnce(testCase.genius.getSearch());
      context.mockGeniusClient.getLyrics.mockResolvedValueOnce(testCase.lyrics.get());

      // Mock Prisma response
      context.mockPrisma.song.create.mockResolvedValueOnce(testCase.prisma.song.create.output('2'));

      const result = await service.create(testCase.id);
      testCase.validators.unit.song(result);
    });

    test('handles instrumental tracks appropriately', async () => {
      const testCase = instrumentalCase;

      context.mockSpotifyClient.getTrack.mockResolvedValueOnce(testCase.spotify.getTrack());
      context.mockGeniusClient.search.mockRejectedValueOnce(new NoMatchingLyricsError());

      await expect(service.create(testCase.id)).rejects.toThrow(NoMatchingLyricsError);
    });

    test('handles lyrics extraction errors', async () => {
      const testCase = validSongCase;

      context.mockSpotifyClient.getTrack.mockResolvedValueOnce(testCase.spotify.getTrack());
      context.mockGeniusClient.search.mockResolvedValueOnce(testCase.genius.getSearch());
      context.mockGeniusClient.getLyrics.mockRejectedValueOnce(new LyricsExtractionError(new Error('Failed to extract lyrics')));

      await expect(service.create(testCase.id)).rejects.toThrow(LyricsExtractionError);
    });
  });
}); 