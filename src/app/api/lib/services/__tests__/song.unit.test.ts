import { SongService } from '@/app/api/lib/services/song';
import { setupUnitTest, cleanupUnitTest, UnitTestContext } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';
import { PrismaClient } from '@prisma/client';
import { GeniusSearchResponse, GeniusHit } from '@/app/api/lib/types/genius';

describe('SongService Unit Tests', () => {
  let context: UnitTestContext;
  let service: SongService;

  beforeEach(() => {
    context = setupUnitTest();
    (context.mockGeniusClient as any).findMatch = jest.fn();
    context.mockPrisma.song = {
      create: jest.fn(),
    } as any;
    service = new SongService(
      context.mockPrisma as unknown as PrismaClient,
      context.mockSpotifyClient,
      context.mockGeniusClient as any
    );
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('fixture-driven create', () => {
    const keys = [
      TRACK_KEYS.PARTY_IN_THE_USA,
      TRACK_KEYS.BEAT_IT,
      TRACK_KEYS.LA_VIE_EN_ROSE
    ];
    for (const key of keys) {
      it(`creates a song with valid fixture data for ${key}`, async () => {
        const track = fixtures.spotify.tracks[key];
        const lyricsHtml = fixtures.genius.lyrics[key];
        const lyrics = lyricsHtml;
        context.mockSpotifyClient.getTrack.mockResolvedValueOnce(track);
        const searchFixture: GeniusSearchResponse = fixtures.genius.search[key];
        const bestMatch: GeniusHit = searchFixture.response.hits[0];
        context.mockGeniusClient.search.mockResolvedValueOnce(searchFixture);
        (context.mockGeniusClient as any).findMatch.mockResolvedValueOnce(bestMatch);
        const now = new Date();
        const expectedGeniusData = {
          title: bestMatch.result.title,
          artist: bestMatch.result.primary_artist?.name || '',
          url: bestMatch.result.url,
        };
        const songResult = {
          id: 'clrqm6nkw0030uy08kg9h1p6x',
          spotifyId: track.id,
          spotifyData: track,
          geniusData: expectedGeniusData,
          lyrics,
          maskedLyrics: fixtures.genius.maskedLyrics[key],
          createdAt: now,
          updatedAt: now,
        };
        (context.mockPrisma.song.create as jest.Mock).mockResolvedValueOnce(songResult);
        const result = await service.create(track.id);
        unit_validator.song_service.create(key, result);
        expect(context.mockSpotifyClient.getTrack).toHaveBeenCalledWith(track.id);
        expect(context.mockPrisma.song.create).toHaveBeenCalled();
      });
    }
  });
}); 