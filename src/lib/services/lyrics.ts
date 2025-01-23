import { validateSchema } from '@/lib/validation';
import { z } from 'zod';

// Schema for text to be masked
const maskTextSchema = z.string().min(1, 'Text to mask is required');

export class LyricsService {
  mask(text: string): string {
    const validatedText = validateSchema(maskTextSchema, text);
    return validatedText.replace(/([a-zA-Z\d]|[à-ü]|[À-Ü])/g, '_');
  }
}

// Export singleton instance
export const lyricsService = new LyricsService(); 