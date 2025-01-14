export interface GameConfig {
  id: string;
  date: string;
  randomSeed: string;
  playlistId: string;
  overrideSongId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuessAttempt {
  word: string;
  timestamp: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  previewUrl: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  tracks: SpotifyTrack[];
}

export interface GameState {
  id: string;
  date: string;
  guessAttempts: GuessAttempt[];
  hiddenSong: {
    maskedLyrics: string;
    maskedTitle: string;
    maskedArtist: string;
    spotify: null | {
      artistName: string;
      songTitle: string;
      albumCover: string;
      previewUrl: string;
    };
    genius: null | {
      lyrics: string;
    };
  };
}
