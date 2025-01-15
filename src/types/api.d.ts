export interface GameResponse {
  id: string;
  date: string;
  playlistId: string;
  overrideSongId: string | null;
  selectedTrackIndex: number;
  createdAt: string;
  updatedAt: string;
  guesses: GuessResponse[];
}

export interface GuessResponse {
  id: string;
  userId: string;
  gameId: string;
  word: string;
  timestamp: string;
  game: GameResponse;
  wasCorrect?: boolean;
}

export interface GameWithProgress extends GameResponse {
  progress: {
    totalGuesses: number;
    correctGuesses: number;
    isComplete: boolean;
  };
  hiddenSong: {
    maskedLyrics: MaskedContent | null;
    maskedTitle: MaskedContent;
    maskedArtist: MaskedContent;
    progress: number;
    spotify: SpotifyContent | null;
    genius: GeniusContent | null;
  };
}

export interface GuessWithIsCorrect extends GuessResponse {
  isCorrect: boolean;
}

export interface MaskedContent {
  original: string;
  maskedText: string;
  words: {
    word: string;
    startIndex: number;
    endIndex: number;
    isRevealed: boolean;
  }[];
  revealedCount: number;
}

export interface SpotifyContent {
  artistName: string;
  songTitle: string;
  albumCover?: string;
  previewUrl: string | null;
}

export interface GeniusContent {
  lyrics: string;
}

export interface GuessResult {
  guess: GuessWithIsCorrect;
  maskedContent: {
    lyrics: MaskedContent | null;
    title: MaskedContent;
    artist: MaskedContent;
    progress: number;
    spotify: SpotifyContent | null;
    genius: GeniusContent | null;
  };
}
