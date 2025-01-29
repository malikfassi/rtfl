import { env } from '@/app/api/lib/env';
import { GeniusApiError } from '@/app/api/lib/errors/clients/genius';
import type { GeniusSearchResponse } from '@/app/types/genius';

export interface GeniusClient {
  search(query: string): Promise<GeniusSearchResponse>;
  fetchLyricsPage(url: string): Promise<string>;
}

export class GeniusClientImpl implements GeniusClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || env.GENIUS_ACCESS_TOKEN;
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://api.genius.com${path}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw GeniusApiError.requestFailed(response.status, response.statusText);
      }

      return response.json();
    } catch (error) {
      throw new GeniusApiError(error as Error);
    }
  }

  async search(query: string): Promise<GeniusSearchResponse> {
    if (!query) {
      throw GeniusApiError.missingQuery();
    }

    try {
      return await this.request<GeniusSearchResponse>('/search', { q: query });
    } catch (error) {
      throw new GeniusApiError(error as Error);
    }
  }

  async fetchLyricsPage(url: string): Promise<string> {
    if (!url) {
      throw GeniusApiError.missingUrl();
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw GeniusApiError.requestFailed(response.status, response.statusText);
      }

      return response.text();
    } catch (error) {
      throw new GeniusApiError(error as Error);
    }
  }
}

// Default instance getter
let defaultClient: GeniusClientImpl | null = null;

export function getGeniusClient(): GeniusClientImpl {
  if (!defaultClient) {
    defaultClient = new GeniusClientImpl(env.GENIUS_ACCESS_TOKEN);
  }
  return defaultClient;
} 