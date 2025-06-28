import { describe, it, expect, beforeEach } from '@jest/globals';
import { MaskedLyricsService } from '../masked-lyrics';
import { setupUnitTest, cleanupUnitTest } from '@/app/api/lib/test/env/unit';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { MaskedLyrics } from '@/app/types';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { unit_validator } from '@/app/api/lib/test/validators';
import { getGeniusUrlFromTrackKey } from '@/app/api/lib/test/utils/genius';
import { createLyricsService } from '../lyrics';

describe('MaskedLyricsService Unit Tests', () => {
  let service: MaskedLyricsService;
  let lyricsService: ReturnType<typeof createLyricsService>;

  beforeEach(() => {
    setupUnitTest();
    service = new MaskedLyricsService();
    lyricsService = createLyricsService();
  });

  afterEach(() => {
    cleanupUnitTest();
  });

  describe('fixture-driven masking', () => {
    const keys = [
      TRACK_KEYS.PARTY_IN_THE_USA,
      TRACK_KEYS.BEAT_IT,
      TRACK_KEYS.LA_VIE_EN_ROSE
    ];
    for (const key of keys) {
      it(`should create masked lyrics for ${key} using extracted lyrics`, async () => {
        const url = getGeniusUrlFromTrackKey(key);
        if (!url) {
          throw new Error(`No Genius URL found for track key ${key}`);
        }
        const lyrics = await lyricsService.getLyrics(url);
        // Infer title and artist from Spotify fixture
        const track = fixtures.spotify.tracks[key];
        if (!track) {
          throw new Error(`No Spotify track fixture found for key ${key}`);
        }
        const title = track.name;
        const artist = track.artists[0]?.name || '';
        const masked = service.create(title, artist, lyrics);
        unit_validator.masked_lyrics_service.create(key, masked);
      });
    }
  });

  describe('create', () => {
    it('should create masked lyrics for PARTY_IN_THE_USA', () => {
      const title = 'Party in the U.S.A.';
      const artist = 'Miley Cyrus';
      const lyrics = 'I hopped off the plane at LAX\nWith a dream and my cardigan\nWelcome to the land of fame excess (Woah)\nAm I gonna fit in?';

      const masked = service.create(title, artist, lyrics);

      // Verify structure
      expect(masked).toHaveProperty('title');
      expect(masked).toHaveProperty('artist');
      expect(masked).toHaveProperty('lyrics');
      expect(Array.isArray(masked.title)).toBe(true);
      expect(Array.isArray(masked.artist)).toBe(true);
      expect(Array.isArray(masked.lyrics)).toBe(true);

      // Check that title tokens include expected words
      const titleTokens = masked.title.filter(token => token.isToGuess);
      expect(titleTokens.some(token => token.value === 'Party')).toBe(true);
      expect(titleTokens.some(token => token.value === 'U')).toBe(true);
      expect(titleTokens.some(token => token.value === 'S')).toBe(true);
      expect(titleTokens.some(token => token.value === 'A')).toBe(true);

      // Check that artist tokens include expected words
      const artistTokens = masked.artist.filter(token => token.isToGuess);
      expect(artistTokens.some(token => token.value === 'Miley')).toBe(true);
      expect(artistTokens.some(token => token.value === 'Cyrus')).toBe(true);

      // Check that lyrics tokens include expected words
      const lyricsTokens = masked.lyrics.filter(token => token.isToGuess);
      expect(lyricsTokens.some(token => token.value === 'I')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'hopped')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'plane')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'LAX')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'dream')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'cardigan')).toBe(true);

      // Check that punctuation and whitespace are not guessable
      const nonGuessableTokens = masked.lyrics.filter(token => !token.isToGuess);
      expect(nonGuessableTokens.some(token => token.value.includes('\n'))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes(' '))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes('('))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes(')'))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes('?'))).toBe(true);
    });

    it('should create masked lyrics for BEAT_IT', () => {
      const title = 'Beat It';
      const artist = 'Michael Jackson';
      const lyrics = 'They told him, "Don\'t you ever come around here"\nDon\'t wanna see your face, you better disappear';

      const masked = service.create(title, artist, lyrics);

      // Check title tokens
      const titleTokens = masked.title.filter(token => token.isToGuess);
      expect(titleTokens.some(token => token.value === 'Beat')).toBe(true);
      expect(titleTokens.some(token => token.value === 'It')).toBe(true);

      // Check artist tokens
      const artistTokens = masked.artist.filter(token => token.isToGuess);
      expect(artistTokens.some(token => token.value === 'Michael')).toBe(true);
      expect(artistTokens.some(token => token.value === 'Jackson')).toBe(true);

      // Check lyrics tokens
      const lyricsTokens = masked.lyrics.filter(token => token.isToGuess);
      expect(lyricsTokens.some(token => token.value === 'They')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'told')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'Don')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 't')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'ever')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'come')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'around')).toBe(true);

      // Check punctuation is not guessable
      const nonGuessableTokens = masked.lyrics.filter(token => !token.isToGuess);
      expect(nonGuessableTokens.some(token => token.value.includes('"'))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes(','))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes('\''))).toBe(true);
    });

    it('should create masked lyrics for LA_VIE_EN_ROSE (French)', () => {
      const title = 'La Vie en Rose';
      const artist = 'Édith Piaf';
      const lyrics = 'Des yeux qui font baisser les miens\nUn rire qui se perd sur sa bouche\nVoilà le portrait sans retouche';

      const masked = service.create(title, artist, lyrics);

      // Check French title tokens
      const titleTokens = masked.title.filter(token => token.isToGuess);
      expect(titleTokens.some(token => token.value === 'La')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Vie')).toBe(true);
      expect(titleTokens.some(token => token.value === 'en')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Rose')).toBe(true);

      // Check French artist tokens with accent
      const artistTokens = masked.artist.filter(token => token.isToGuess);
      expect(artistTokens.some(token => token.value === 'Édith')).toBe(true);
      expect(artistTokens.some(token => token.value === 'Piaf')).toBe(true);

      // Check French lyrics tokens
      const lyricsTokens = masked.lyrics.filter(token => token.isToGuess);
      expect(lyricsTokens.some(token => token.value === 'Des')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'yeux')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'qui')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'font')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'baisser')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'les')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'miens')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'Voilà')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'le')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'portrait')).toBe(true);
    });

    it('should handle punctuation and special characters correctly', () => {
      const title = "Don't Stop Me Now!";
      const artist = 'Queen';
      const lyrics = "Don't stop me now, I'm having such a good time...\nI'm a shooting star leaping through the sky";

      const masked = service.create(title, artist, lyrics);

      // Words should be guessable
      const titleTokens = masked.title.filter(token => token.isToGuess);
      expect(titleTokens.some(token => token.value === 'Don')).toBe(true);
      expect(titleTokens.some(token => token.value === 't')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Stop')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Me')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Now')).toBe(true);

      // Punctuation should not be guessable
      const nonGuessableTokens = masked.title.filter(token => !token.isToGuess);
      expect(nonGuessableTokens.some(token => token.value.includes("'"))).toBe(true);
      expect(nonGuessableTokens.some(token => token.value.includes('!'))).toBe(true);

      // Check lyrics contractions are handled
      const lyricsTokens = masked.lyrics.filter(token => token.isToGuess);
      expect(lyricsTokens.some(token => token.value === 'I')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'm')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'having')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'such')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'good')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'time')).toBe(true);
    });

    it('should handle numbers correctly', () => {
      const title = 'Highway 61 Revisited';
      const artist = 'Bob Dylan';
      const lyrics = 'God said to Abraham, "Kill me a son"\n61 years later, still on the run';

      const masked = service.create(title, artist, lyrics);

      // Numbers should be guessable
      const titleTokens = masked.title.filter(token => token.isToGuess);
      expect(titleTokens.some(token => token.value === '61')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Highway')).toBe(true);
      expect(titleTokens.some(token => token.value === 'Revisited')).toBe(true);

      const lyricsTokens = masked.lyrics.filter(token => token.isToGuess);
      expect(lyricsTokens.some(token => token.value === '61')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'God')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'said')).toBe(true);
      expect(lyricsTokens.some(token => token.value === 'Abraham')).toBe(true);
    });
  });

  describe('hasWord', () => {
    let maskedLyrics: MaskedLyrics;

    beforeEach(() => {
      maskedLyrics = service.create(
        'Party in the U.S.A.',
        'Miley Cyrus',
        'I hopped off the plane at LAX\nWith a dream and my cardigan\nWelcome to the land of fame excess'
      );
    });

    it('should find words that exist in title', () => {
      expect(service.hasWord('Party', maskedLyrics)).toBe(true);
      expect(service.hasWord('party', maskedLyrics)).toBe(true); // case insensitive
      expect(service.hasWord('U', maskedLyrics)).toBe(true);
      expect(service.hasWord('S', maskedLyrics)).toBe(true);
      expect(service.hasWord('A', maskedLyrics)).toBe(true);
    });

    it('should find words that exist in artist', () => {
      expect(service.hasWord('Miley', maskedLyrics)).toBe(true);
      expect(service.hasWord('miley', maskedLyrics)).toBe(true); // case insensitive
      expect(service.hasWord('Cyrus', maskedLyrics)).toBe(true);
      expect(service.hasWord('cyrus', maskedLyrics)).toBe(true); // case insensitive
    });

    it('should find words that exist in lyrics', () => {
      expect(service.hasWord('I', maskedLyrics)).toBe(true);
      expect(service.hasWord('hopped', maskedLyrics)).toBe(true);
      expect(service.hasWord('plane', maskedLyrics)).toBe(true);
      expect(service.hasWord('LAX', maskedLyrics)).toBe(true);
      expect(service.hasWord('dream', maskedLyrics)).toBe(true);
      expect(service.hasWord('cardigan', maskedLyrics)).toBe(true);
      expect(service.hasWord('Welcome', maskedLyrics)).toBe(true);
      expect(service.hasWord('land', maskedLyrics)).toBe(true);
      expect(service.hasWord('fame', maskedLyrics)).toBe(true);
      expect(service.hasWord('excess', maskedLyrics)).toBe(true);
    });

    it('should not find words that do not exist', () => {
      expect(service.hasWord('nonexistent', maskedLyrics)).toBe(false);
      expect(service.hasWord('random', maskedLyrics)).toBe(false);
      expect(service.hasWord('nowhere', maskedLyrics)).toBe(false);
      expect(service.hasWord('impossible', maskedLyrics)).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(service.hasWord(' Party ', maskedLyrics)).toBe(true);
      expect(service.hasWord('hopped\n', maskedLyrics)).toBe(true);
      expect(service.hasWord('\tMiley\t', maskedLyrics)).toBe(true);
    });

    it('should not find punctuation', () => {
      expect(service.hasWord('.', maskedLyrics)).toBe(false);
      expect(service.hasWord('(', maskedLyrics)).toBe(false);
      expect(service.hasWord(')', maskedLyrics)).toBe(false);
      expect(service.hasWord('\n', maskedLyrics)).toBe(false);
      expect(service.hasWord(' ', maskedLyrics)).toBe(false);
    });

    it('should work with different track constants', () => {
      const beatItMasked = service.create(
        'Beat It',
        'Michael Jackson',
        'They told him, "Don\'t you ever come around here"'
      );

      expect(service.hasWord('Beat', beatItMasked)).toBe(true);
      expect(service.hasWord('It', beatItMasked)).toBe(true);
      expect(service.hasWord('Michael', beatItMasked)).toBe(true);
      expect(service.hasWord('Jackson', beatItMasked)).toBe(true);
      expect(service.hasWord('They', beatItMasked)).toBe(true);
      expect(service.hasWord('told', beatItMasked)).toBe(true);
      expect(service.hasWord('around', beatItMasked)).toBe(true);
      expect(service.hasWord('here', beatItMasked)).toBe(true);

      // Should not find words from other songs
      expect(service.hasWord('Party', beatItMasked)).toBe(false);
      expect(service.hasWord('Miley', beatItMasked)).toBe(false);
      expect(service.hasWord('hopped', beatItMasked)).toBe(false);
    });
  });

  describe('getText', () => {
    let maskedLyrics: MaskedLyrics;

    beforeEach(() => {
      maskedLyrics = service.create(
        'Test Song',
        'Test Artist',
        'These are test lyrics with some words'
      );
    });

    it('should return complete text when no guessed words provided', () => {
      const result = service.getText(maskedLyrics);
      
      expect(result.title).toBe('Test Song');
      expect(result.artist).toBe('Test Artist');
      expect(result.lyrics).toBe('These are test lyrics with some words');
    });

    it('should mask unguessed words with underscores', () => {
      const guessedWords = new Set(['Test', 'are', 'with']);
      const result = service.getText(maskedLyrics, guessedWords);
      
      expect(result.title).toContain('Test');
      expect(result.title).toContain('____'); // Song should be masked
      expect(result.artist).toContain('Test');
      expect(result.artist).toContain('______'); // Artist should be masked
      expect(result.lyrics).toContain('are');
      expect(result.lyrics).toContain('with');
      expect(result.lyrics).toContain('_____'); // These should be masked
      expect(result.lyrics).toContain('____'); // test should be masked
    });

    it('should handle case insensitive guesses', () => {
      const guessedWords = new Set(['test', 'SONG', 'ArTiSt']);
      const result = service.getText(maskedLyrics, guessedWords);
      
      expect(result.title).toBe('Test Song');
      expect(result.artist).toBe('Test Artist');
    });
  });
}); 