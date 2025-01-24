import { Song } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';

export type GameStatus = 'loading' | 'success' | 'error' | 'to-create' | 'to-edit';

export interface GameStatusInfo {
  status: GameStatus;
  error?: string;
  newSong?: Track;
  currentSong?: Track;
}

export interface Game {
  id: string;
  date: string;
  spotifyId: string;
  song?: {
    title: string;
    artist: string;
    spotifyId: string;
  };
}

export interface GameInput {
  date: string;
  spotifyId: string;
}

export interface AdminGame {
  id: string;
  date: string;
  song: Song;
  status?: GameStatusInfo;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export interface GameMutations {
  createGame: (input: GameInput) => Promise<Game>;
  updateGame: (id: string, input: Partial<GameInput>) => Promise<Game>;
  deleteGame: (id: string) => Promise<void>;
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