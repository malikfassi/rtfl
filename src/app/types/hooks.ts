import type { SpotifyTrack } from './spotify';

// Game progress hook types
export interface GameProgressState {
  lyricsProgressData: { found: number; total: number };
  titleProgressData: { found: number; total: number };
  artistProgressData: { found: number; total: number };
  lyricsWin: boolean;
  titleWin: boolean;
  artistWin: boolean;
  isGameComplete: boolean;
  lyricsPercent: number;
  titlePercent: number;
  artistPercent: number;
}

// Game share hook types
export interface GameShareProps {
  isGameComplete: boolean;
  lyricsPercent: number;
  titlePercent: number;
  artistPercent: number;
  guessCount: number;
  date: string;
}

export interface GameShareState {
  shareText: string;
  gameUrl: string;
  handleShare: () => void;
}

// Word highlighting hook types
export interface UseWordHighlightingProps {
  foundWords: string[];
  hoveredWord: string | null;
  selectedWord: string | null;
}

// Toast hook types
export interface ToasterToast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export interface State {
  toasts: ToasterToast[];
}

// Rickroll game types
export interface RickrollGame {
  isActive: boolean;
  startTime: number;
  duration: number;
}

// Playlist hook types
export interface PlaylistsResponse {
  playlists: Array<{
    id: string;
    name: string;
    tracks: SpotifyTrack[];
  }>;
}

export interface TracksResponse {
  tracks: SpotifyTrack[];
} 