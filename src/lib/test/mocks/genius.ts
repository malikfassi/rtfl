import { GeniusClient, GeniusSearchResponse } from '@/lib/clients/genius';
import { GeniusError } from '@/lib/errors/genius';
import { geniusData } from '@/lib/test/fixtures/genius';

export class GeniusClientMock implements GeniusClient {
  search = jest.fn().mockImplementation(async (query: string): Promise<GeniusSearchResponse> => {
    if (!query?.trim()) {
      throw new GeniusError('Search query is required');
    }
    return geniusData.search[query] || { response: { hits: [] } };
  });

  searchSong = jest.fn().mockImplementation(async (title: string, artist: string): Promise<string> => {
    if (!title?.trim() || !artist?.trim()) {
      throw new GeniusError('Title and artist are required');
    }
    const query = `${title} ${artist}`;
    const response = geniusData.search[query];
    if (!response?.response.hits.length) {
      throw new GeniusError('No lyrics found');
    }
    return geniusData.lyrics[query] || '';
  });

  extractLyricsFromHTML = jest.fn().mockReturnValue(Promise.resolve(null));

  request = jest.fn().mockImplementation(() => {
    throw new GeniusError('Not implemented in mock');
  });

  clearMocks() {
    this.search.mockClear();
    this.searchSong.mockClear();
  }
} 