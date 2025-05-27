import { fixtures } from '../fixtures';
import type { GeniusClient } from '@/app/api/lib/clients/genius';

export class GeniusMocks {
  static createClient(): jest.Mocked<GeniusClient> {
    return {
      search: jest.fn().mockImplementation(async (query: string) => {
        try {
          return fixtures.genius.search.get(query);
        } catch (error) {
          // Return empty response for unknown queries
          return {
            response: {
              hits: []
            }
          };
        }
      }),
      
      fetchLyricsPage: jest.fn().mockImplementation(async (url: string) => {
        try {
          return fixtures.genius.lyrics.get(url);
        } catch (error) {
          throw new Error('Lyrics not found');
        }
      }),

      getLyrics: jest.fn().mockImplementation(async (url: string) => {
        try {
          const html = fixtures.genius.lyrics.get(url);
          // Extract lyrics from HTML here since this is the getLyrics method
          return html;
        } catch (error) {
          throw new Error('Lyrics not found');
        }
      })
    };
  }
}