import type { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';

export type GameStatus = 'to-create' | 'to-edit' | 'loading' | 'success' | 'error';

export interface GameStatusInfo {
  status: GameStatus;
  currentSong?: Track;
  newSong?: Track;
  error?: string;
}

export interface AdminGame {
  id: string;
  date: string;
  song: {
    id: string;
    spotifyId: string;
    spotifyData: Track;
    lyrics: string;
    maskedLyrics: {
      title: string[];
      artist: string[];
      lyrics: string[];
    };
  };
  status?: GameStatusInfo;
}

export interface Playlist extends SimplifiedPlaylist {}

export interface GameMutations {
  createOrUpdateGame: (date: string, spotifyId: string) => Promise<AdminGame>;
  deleteGame: (date: string) => Promise<void>;
}

export interface AdminApiClient {
  // Game Management
  listGames(month: string): Promise<AdminGame[]>;
  getGame(date: string): Promise<AdminGame>;
  createOrUpdateGame(date: string, spotifyId: string): Promise<AdminGame>;
  deleteGame(date: string): Promise<void>;
  
  // Playlist Management
  listPlaylists(): Promise<Playlist[]>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
} 