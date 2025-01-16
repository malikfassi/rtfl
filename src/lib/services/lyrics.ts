interface MaskedLyrics {
  title: string[];
  artist: string[];
  lyrics: string[];
}

export class LyricsService {
  private maskWord(word: string): string {
    return '_'.repeat(word.length);
  }

  private splitAndMask(text: string): string[] {
    return text
      .split(/\s+/)
      .map(word => this.maskWord(word));
  }

  maskSong(title: string, artist: string, lyrics: string): MaskedLyrics {
    return {
      title: this.splitAndMask(title),
      artist: this.splitAndMask(artist),
      lyrics: this.splitAndMask(lyrics),
    };
  }
}

// Export singleton instance
export const lyricsService = new LyricsService(); 