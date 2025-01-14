import { createMaskedText } from './masking';
import {
  calculateProgress,
  isTitleArtistComplete,
  isLyricsThresholdMet,
  getRemainingWords,
  updateMaskedText,
  MaskedContent,
} from './state';

describe('Game State Management', () => {
  let sampleContent: MaskedContent;
  let revealedWords: string[];

  beforeEach(() => {
    const text = "Hello hello world, I'm testing";
    sampleContent = createMaskedText(text);
    revealedWords = [];
  });

  describe('calculateProgress', () => {
    it('calculates 0% for no revealed words', () => {
      expect(calculateProgress(sampleContent, [])).toBe(0);
    });

    it('calculates progress for revealed words', () => {
      revealedWords = ['hello', 'world'];
      // 3 out of 5 words revealed (hello appears twice)
      expect(calculateProgress(sampleContent, revealedWords)).toBe(60);
    });

    it('returns 100% for empty content', () => {
      const emptyContent = createMaskedText('');
      expect(calculateProgress(emptyContent, [])).toBe(100);
    });
  });

  describe('isTitleArtistComplete', () => {
    const title = createMaskedText('Test Song');
    const artist = createMaskedText('Test Artist');

    it('returns false when neither is complete', () => {
      expect(isTitleArtistComplete(title, artist, [])).toBe(false);
    });

    it('returns false when only title is complete', () => {
      expect(isTitleArtistComplete(title, artist, ['test', 'song'])).toBe(false);
    });

    it('returns false when only artist is complete', () => {
      expect(isTitleArtistComplete(title, artist, ['test', 'artist'])).toBe(false);
    });

    it('returns true when both are complete', () => {
      expect(isTitleArtistComplete(title, artist, ['test', 'song', 'artist'])).toBe(true);
    });
  });

  describe('isLyricsThresholdMet', () => {
    it('returns false for less than 80%', () => {
      revealedWords = ['hello', 'world']; // 60%
      expect(isLyricsThresholdMet(sampleContent, revealedWords)).toBe(false);
    });

    it('returns true for 80% or more', () => {
      revealedWords = ['hello', 'world', "i'm", 'testing']; // 100%
      expect(isLyricsThresholdMet(sampleContent, revealedWords)).toBe(true);
    });
  });

  describe('getRemainingWords', () => {
    it('returns all words initially', () => {
      expect(getRemainingWords(sampleContent, [])).toEqual(['hello', "i'm", 'testing', 'world']);
    });

    it('excludes revealed words', () => {
      revealedWords = ['hello', 'world'];
      expect(getRemainingWords(sampleContent, revealedWords)).toEqual(["i'm", 'testing']);
    });

    it('returns empty array when all words revealed', () => {
      revealedWords = ['hello', 'world', "i'm", 'testing'];
      expect(getRemainingWords(sampleContent, revealedWords)).toEqual([]);
    });
  });

  describe('updateMaskedText', () => {
    it('masks all words initially', () => {
      expect(updateMaskedText(sampleContent, [])).toBe("_____ _____ _____, _'_ _______");
    });

    it('reveals matched words', () => {
      revealedWords = ['hello', 'world'];
      expect(updateMaskedText(sampleContent, revealedWords)).toBe("Hello hello world, _'_ _______");
    });

    it('reveals all words when complete', () => {
      revealedWords = ['hello', 'world', "i'm", 'testing'];
      expect(updateMaskedText(sampleContent, revealedWords)).toBe(sampleContent.original);
    });
  });
});
