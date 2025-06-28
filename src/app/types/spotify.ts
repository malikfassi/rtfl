import type { Track, Playlist as SpotifyPlaylistType, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

// Re-export official types for consistency
export type SpotifyTrack = Track;
export type SpotifyPlaylist = SpotifyPlaylistType;
export type SpotifySimplifiedPlaylist = SimplifiedPlaylist;

// Custom types that extend official ones
export interface CustomPlaylist {
  id: string;
  name: string;
  tracks: Track[];
}

// Service interfaces
export interface SpotifyServiceInterface {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
}

export interface SpotifyClient {
  getTrack(id: string): Promise<Track>;
  searchTracks(query: string): Promise<Track[]>;
  getPlaylist(id: string): Promise<SpotifyPlaylist>;
  searchPlaylists(query: string): Promise<SpotifyPlaylist[]>;
}

// API response types
export interface PlaylistsResponse {
  playlists: CustomPlaylist[];
}

export interface TracksResponse {
  tracks: Track[];
}

// Custom data types for internal use
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

// Legacy types for backward compatibility (deprecated - use official SDK types)
export interface SpotifyArtist {
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyAlbum {
  album_type: string;
  artists: SpotifyArtist[];
  available_markets: string[];
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
} 