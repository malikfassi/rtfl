import { describe, it, afterEach, beforeEach } from '@jest/globals';
import { MaskedLyricsService } from '../masked-lyrics';
import { LyricsService } from '../lyrics';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/app/api/lib/test/env/integration';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { getGeniusUrlFromTrackKey } from '@/app/api/lib/test/utils/genius';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import type { MaskedLyrics, Token } from '@/app/types';

describe('MaskedLyricsService Integration', () => {
  let service: MaskedLyricsService;
  let lyricsService: LyricsService;

  beforeEach(async () => {
    await setupIntegrationTest();
    service = new MaskedLyricsService(); // Real service, no mocks
    lyricsService = new LyricsService(); // Real service, no mocks
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  describe('fixture-driven integration', () => {
    const keys = [
      TRACK_KEYS.PARTY_IN_THE_USA,
      TRACK_KEYS.BEAT_IT,
      TRACK_KEYS.LA_VIE_EN_ROSE
    ];
    for (const key of keys) {
      it(`should create masked lyrics for ${key} using extracted lyrics`, async () => {
        const url = getGeniusUrlFromTrackKey(key);
        if (!url) throw new Error(`No Genius URL found for track key ${key}`);
        const lyrics = await lyricsService.getLyrics(url);
        const track = fixtures.spotify.tracks[key];
        if (!track) throw new Error(`No Spotify track fixture found for key ${key}`);
        const title = track.name;
        const artist = track.artists[0]?.name || '';
        const masked = service.create(title, artist, lyrics);
        const integrationMasked = toIntegrationMaskedLyrics(masked, lyrics);
        integration_validator.masked_lyrics_service.create(integrationMasked);
      });
    }
  });
});

// Helper to convert MaskedLyricsService output to integration validator format
function toIntegrationMaskedLyrics(masked: MaskedLyrics, originalLyrics: string): {
  originalLyrics: string;
  maskedLyrics: string;
  totalWords: number;
  guessableWords: number;
} {
  const flatten = (tokens: Token[]) => tokens.map((t) => t.value).join('');
  const allTokens = [...masked.title, ...masked.artist, ...masked.lyrics];
  const totalWords = allTokens.filter((t) => t.isToGuess).length;
  const guessableWords = totalWords; // All guessable tokens are words
  const maskedLyrics = flatten(masked.lyrics).replace(/\w/g, '_'); // crude mask for validator
  return {
    originalLyrics,
    maskedLyrics,
    totalWords,
    guessableWords
  };
} 