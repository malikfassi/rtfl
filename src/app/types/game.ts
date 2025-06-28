import type { Song, Guess } from '@prisma/client';
import type { Token } from './common';
import type { Track } from '@spotify/web-api-ts-sdk';

// Game status types
export type GameStatus = 'loading' | 'success' | 'error' | 'to-create' | 'to-edit';

// Game statistics - consolidated from multiple sources
export interface GameStats {
  totalGuesses: number;
  correctGuesses: number;
  averageAttempts: number;
  wins: number;
  totalPlayers: number;
  averageGuesses: number;
  totalValidGuesses: number;
  averageLyricsCompletionForWinners: number;
  difficultyScore: number;
}

// Masked lyrics structure
export interface MaskedLyrics {
  title: Token[];
  artist: Token[];
  lyrics: Token[];
}

// Game state types - consolidated from API and frontend
export interface GameState {
  id: string;
  date: string;
  masked: MaskedLyrics;
  guesses: Guess[];
  song?: {
    title?: string;
    artist?: string;
  };
  stats?: GameStats;
}

// Frontend game state (extends API GameState)
export interface FrontendGameState {
  currentGame: GameState | null | undefined;
  isGameLoading: boolean;
  gameError: Error | null;
  isGameComplete: boolean;
  lyricsProgressData: { found: number; total: number };
  titleProgressData: { found: number; total: number };
  artistProgressData: { found: number; total: number };
  foundWords: string[];
  maskedTitle: string;
  maskedArtist: string;
  maskedLyrics: string;
  maskedTitleParts: Token[] | undefined;
  maskedArtistParts: Token[] | undefined;
  maskedLyricsParts: Token[] | undefined;
  guessSegments: Array<{ id: string; hits: number; colorIndex: number }>;
  shareText: string;
  gameUrl: string;
  handleGuess: (guess: string) => Promise<void>;
  handleShare: () => void;
}

// Game input/output types
export interface GameInput {
  date: string;
  spotifyId: string;
}

export interface Game {
  id: string;
  date: string;
  songId: string;
  song?: Song;
}

// Admin game types
export interface AdminGame {
  id: string;
  date: string;
  song: Song;
  status?: GameStatusInfo;
}

export interface GameStatusInfo {
  status: GameStatus;
  error?: string;
  newSong?: Track;
  currentSong?: Track;
}

// Admin-specific types
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

// Extended game types with relations
export type GameWithSong = Game & {
  song: Song;
  stats: GameStats;
};

export type GameWithSongAndGuesses = GameWithSong & {
  guesses: Guess[];
};

// Game logic props
export interface GameLogicProps {
  date: string;
  game?: GameState;
} 