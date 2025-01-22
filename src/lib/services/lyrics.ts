export class LyricsService {
  mask(text: string): string[] {
    return text
      .split(/\s+/)
      .map(word => word.replace(/[\p{L}\d]/gu, '_'));
  }
}

// Export singleton instance
export const lyricsService = new LyricsService(); 