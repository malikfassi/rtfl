export interface Game {
  id: string;
  date: Date;
  randomSeed: string;
  playlistId: string;
  overrideSongId: string | null;
  createdAt: Date;
  updatedAt: Date;
  guesses: Guess[];
}

export interface Guess {
  id: string;
  userId: string;
  gameId: string;
  word: string;
  isCorrect: boolean;
  timestamp: Date;
  game: Game;
}

export interface GuessAttempt {
  word: string;
  timestamp: string;
  isCorrect: boolean;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  previewUrl: string;
  albumCover: string;
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
