import { z } from 'zod';

import { validateSchema } from '@/app/api/lib/validation';

// Schema for text to be masked
const maskTextSchema = z.string().min(1, 'Text to mask is required');

export class LyricsService {
  public mask(text: string): string {
    console.log('Masking text:', { text });
  
    // Validate the input
    const validatedText = validateSchema(maskTextSchema, text);
  
    // Mask only letters and numbers while preserving other characters
    const result = validatedText.replace(/\p{L}+|\p{N}+/gu, word => '_'.repeat(word.length));
  
    console.log('Masked result:', { result });
    return result;
  }

  public partial_mask(text: string, guessedWords: Set<string>): string {
    console.log('Partial masking:', { text, guessedWords: Array.from(guessedWords) });
  
    // Validate the input
    const validatedText = validateSchema(maskTextSchema, text);
  
    // Normalize guessedWords for case-insensitive matching
    const normalizedGuessedWords = new Set(
      Array.from(guessedWords).map(word => word.toLowerCase())
    );

    // Mask all letters and numbers, but preserve guessed words
    const result = validatedText.replace(/\p{L}+|\p{N}+/gu, (word) => {
      const normalizedWord = word.toLowerCase();
      return normalizedGuessedWords.has(normalizedWord) ? word : '_'.repeat(word.length);
    });
  
    console.log('Final result:', { result });
    return result;
  }
}

// Export singleton instance
export const lyricsService = new LyricsService(); 