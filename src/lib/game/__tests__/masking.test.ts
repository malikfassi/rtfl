import { createMaskedText, updateMasking } from '../masking';

describe('Text Masking', () => {
  describe('createMaskedText', () => {
    it('should mask all words initially', () => {
      const result = createMaskedText('Hello World', []);
      expect(result.maskedText).toBe('_____ _____');
      expect(result.words).toHaveLength(2);
      expect(result.words.every((w) => !w.isRevealed)).toBe(true);
    });

    it('should reveal matched words', () => {
      const result = createMaskedText('Hello World', ['hello']);
      expect(result.maskedText).toBe('Hello _____');
      expect(result.words[0].isRevealed).toBe(true);
      expect(result.words[1].isRevealed).toBe(false);
    });

    it('should handle case-insensitive matches', () => {
      const result = createMaskedText('Hello World', ['HELLO', 'world']);
      expect(result.maskedText).toBe('Hello World');
      expect(result.words.every((w) => w.isRevealed)).toBe(true);
    });

    it('should preserve special characters', () => {
      const result = createMaskedText("Hello, World! What's up?", ['hello', 'world']);
      expect(result.maskedText).toBe("Hello, World! ____'_ __?");
    });

    it('should handle empty text', () => {
      const result = createMaskedText('', []);
      expect(result.maskedText).toBe('');
      expect(result.words).toHaveLength(0);
    });
  });

  describe('updateMasking', () => {
    it('should reveal new word', () => {
      const initial = createMaskedText('Hello World', []);
      const updated = updateMasking(initial, 'hello');
      expect(updated.maskedText).toBe('Hello _____');
      expect(updated.words[0].isRevealed).toBe(true);
    });

    it('should not modify state if word not found', () => {
      const initial = createMaskedText('Hello World', ['hello']);
      const updated = updateMasking(initial, 'test');
      expect(updated).toEqual(initial);
    });

    it('should handle multiple occurrences of same word', () => {
      const initial = createMaskedText('Hello hello HELLO', []);
      const updated = updateMasking(initial, 'hello');
      expect(updated.maskedText).toBe('Hello hello HELLO');
      expect(updated.words.every((w) => w.isRevealed)).toBe(true);
    });
  });
});
