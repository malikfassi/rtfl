import { createMaskedText, findWords, maskText } from './masking';

describe('Word Masking', () => {
  describe('findWords', () => {
    it('finds words and their positions', () => {
      const text = "Hello, it's me\nI've been wondering";
      const words = findWords(text);
      expect(words).toEqual([
        { word: 'hello', startIndex: 0, endIndex: 4 },
        { word: "it's", startIndex: 7, endIndex: 10 },
        { word: 'me', startIndex: 12, endIndex: 13 },
        { word: "i've", startIndex: 15, endIndex: 18 },
        { word: 'been', startIndex: 20, endIndex: 23 },
        { word: 'wondering', startIndex: 25, endIndex: 33 },
      ]);
    });

    it('handles numbers and special characters', () => {
      const text = 'Hello123 @world #test';
      const words = findWords(text);
      expect(words).toEqual([
        { word: 'hello123', startIndex: 0, endIndex: 7 },
        { word: 'world', startIndex: 10, endIndex: 14 },
        { word: 'test', startIndex: 17, endIndex: 20 },
      ]);
    });
  });

  describe('maskText', () => {
    it('masks words while preserving special characters', () => {
      const text = "Hello123, it's me";
      const words = findWords(text);
      const masked = maskText(text, words);
      expect(masked).toBe("________, __'_ __");
    });

    it('handles overlapping word positions', () => {
      const text = 'hellohello';
      const words = findWords(text);
      const masked = maskText(text, words);
      expect(masked).toBe('__________');
    });
  });

  describe('createMaskedText', () => {
    it('creates complete masked text object', () => {
      const text = "Hello123, it's me";
      const result = createMaskedText(text);
      expect(result).toEqual({
        original: text,
        maskedText: "________, __'_ __",
        words: [
          { word: 'hello123', startIndex: 0, endIndex: 7 },
          { word: "it's", startIndex: 10, endIndex: 13 },
          { word: 'me', startIndex: 15, endIndex: 16 },
        ],
      });
    });

    it('handles empty text', () => {
      const result = createMaskedText('');
      expect(result).toEqual({
        original: '',
        maskedText: '',
        words: [],
      });
    });
  });
});
