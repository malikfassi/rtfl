export type GameStatus = 'to-create' | 'to-edit' | 'loading' | 'success';

export interface GameStatusInfo {
  status: GameStatus;
  currentSong?: {
    title: string;
    artist: string;
  };
  newSong?: {
    title: string;
    artist: string;
  };
}

export interface AdminGame {
  id: string;
  date: string;
  song: {
    id: string;
    title: string;
    artist: string;
    spotifyId: string;
  };
  status?: GameStatusInfo;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
}

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
  getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]>;
} 