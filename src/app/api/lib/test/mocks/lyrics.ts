import { fixtures } from '../fixtures';

export interface LyricsClient {
  getLyrics(songId: string): Promise<string>;
}

export class LyricsMocks {
  static createClient(): jest.Mocked<LyricsClient> {
    return {
      getLyrics: jest.fn().mockImplementation(async (songId: string) => {
        // For fixture-based keys, return the corresponding lyrics
        try {
          return fixtures.genius.lyrics[songId] || 'Mock lyrics content';
        } catch (error) {
          return 'Mock lyrics content';
        }
      })
    } as jest.Mocked<LyricsClient>;
  }
} 