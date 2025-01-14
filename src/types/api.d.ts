import type { GameState, SpotifyPlaylist, SpotifyTrack } from './game';

export type ApiError = {
  code: 'GAME_NOT_FOUND' | 'INVALID_DATE' | 'RATE_LIMITED' | 'INVALID_WORD';
  message: string;
};

export interface GuessRequest {
  word: string;
}

export interface ArchiveResponse {
  games: GameState[];
}

export interface GameConfigResponse {
  id: string;
  date: string;
  playlistId: string;
  overrideSongId: string | null;
  selectedSong: SpotifyTrack;
  playlist: SpotifyPlaylist;
  lyrics: string;
  stats: {
    totalPlayers: number;
    totalGuesses: number;
    completionRate: number;
  };
}

export interface BatchCreateRequest {
  startDate: string;
  endDate: string;
  playlistId: string;
}

export interface PlaylistSearchResponse {
  playlists: Array<{
    id: string;
    name: string;
    trackCount: number;
  }>;
}

export interface UpdatePlaylistRequest {
  playlistId: string;
}

export interface SetOverrideRequest {
  songId: string;
}
