import { fixtures } from '../fixtures';
import type { GeniusClient } from '@/app/api/lib/clients/genius';
import { TEST_IDS } from '../constants';

// All fixture access is by constant key only. No mapping helpers used.

export class GeniusMocks {
  static createClient(): jest.Mocked<GeniusClient> {
    return {
      search: jest.fn().mockImplementation(async (key: string) => {
        // Always return the fixture for the key (including error/edge cases)
        return fixtures.genius.search[key];
      }),
      
      fetchLyricsPage: jest.fn().mockImplementation(async (url: string) => {
        if (!url.startsWith('http')) {
          throw new (require('@/app/api/lib/errors/clients/genius').GeniusApiError)(new Error('Not a valid URL'));
        }
        // Try to find the key whose search fixture's first hit has this URL
        const key = Object.keys(fixtures.genius.search).find(k => {
          const searchFixture = fixtures.genius.search[k];
          const firstHitUrl = searchFixture?.response?.hits?.[0]?.result?.url;
          return firstHitUrl && firstHitUrl === url;
        });
        if (!key) {
          throw new (require('@/app/api/lib/errors/clients/genius').GeniusApiError)(new Error('No fixture for this URL'));
        }
        const html = fixtures.genius.lyrics[key];
        if (!html) {
          throw new (require('@/app/api/lib/errors/clients/genius').GeniusApiError)(new Error('No lyrics HTML fixture for this key'));
        }
        return html;
      }),

      getLyrics: jest.fn().mockImplementation(async (key: string) => {
        if (
          key === TEST_IDS.GENIUS.URLS.NO_LYRICS
        ) {
          return '';
        }
        try {
          const html = fixtures.genius.lyrics[key];
          return html;
        } catch (error) {
          return '';
        }
      })
    } as jest.Mocked<GeniusClient>;
  }
}