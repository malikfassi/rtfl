import type { Track } from '@spotify/web-api-ts-sdk';

export interface SpotifyServiceInterface {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
}

export interface SpotifyData {
  name: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  preview_url: string | null;
}