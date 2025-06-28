import type { Token, Color } from './common';
import type { GameState } from './game';
import type { SpotifyTrack, SpotifyPlaylist } from './spotify';

// Game component props
export interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
}

export interface GameControlsProps {
  playerId: string;
  date: string;
  isGameComplete: boolean;
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  maskedLyrics: string;
  maskedTitle: string;
  maskedArtist: string;
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
  maskedLyricsParts?: Token[];
  onGuess: (guess: string) => Promise<void>;
  isSubmitting: boolean;
  onWordHover: (word: string | null) => void;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
  colors: Color[];
  className?: string;
}

export interface GameProgressProps {
  lyricsFound: number;
  lyricsTotal: number;
  titleFound: number;
  titleTotal: number;
  artistFound: number;
  artistTotal: number;
  lyricsWin: boolean;
  titleWin: boolean;
  artistWin: boolean;
  className?: string;
}

export interface GameHeaderProps {
  title: string;
  date: string;
  playerId: string;
  isAdmin?: boolean;
  onChooseSong?: () => void;
  hideChooseSongButton?: boolean;
  className?: string;
}

export interface MaskedLyricsProps {
  title: string;
  artist: string;
  lyrics: string;
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
  maskedLyricsParts?: Token[];
  isComplete?: boolean;
  foundWords: string[];
  hoveredWord?: string | null;
  selectedWord?: string | null;
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  colors: Color[];
  song?: { lyrics: string; } | null;
  isAdmin?: boolean;
  showFullLyrics?: boolean;
}

export interface WordRendererProps {
  word: string;
  isFound: boolean;
  shouldShow: boolean;
  isNewlyFound: boolean;
  isHovered: boolean;
  isSelected: boolean;
  color?: Color;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface LyricsRendererProps {
  lyrics: string | Token[];
  foundWords: string[];
  hoveredWord?: string | null;
  selectedWord?: string | null;
  colors: Color[];
  guesses: Array<{ word: string; valid: boolean }>;
  isComplete?: boolean;
  showFullLyrics?: boolean;
  onWordClick?: (word: string) => void;
  onWordHover?: (word: string | null) => void;
}

export interface GuessHistoryProps {
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  maskedLyrics: string;
  maskedTitle: string;
  maskedArtist: string;
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
  maskedLyricsParts?: Token[];
  onWordHover: (word: string | null) => void;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
  colors: Color[];
}

export interface GameCompletionProps {
  isComplete: boolean;
  shareText: string;
  onShare: () => void;
  className?: string;
}

export interface GameSidebarProps {
  date: string;
  isGameComplete: boolean;
  lyricsProgressData: { found: number; total: number };
  titleProgressData: { found: number; total: number };
  artistProgressData: { found: number; total: number };
  className?: string;
}

export interface ErrorModalProps {
  error: Error | string;
  onClose: () => void;
  onRetry?: () => void;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareText: string;
  gameUrl: string;
}

// Admin component props
export interface AdminDashboardProps {
  className?: string;
}

export interface GameEditorProps {
  date: string;
  className?: string;
}

export interface CalendarProps {
  games: Array<{
    id: string;
    date: string;
    song: {
      title: string;
      artist: string;
    };
  }>;
  onGameSelect: (date: string) => void;
  selectedDate?: string;
  className?: string;
}

export interface CalendarDayProps {
  date: string;
  game?: {
    id: string;
    song: {
      title: string;
      artist: string;
    };
  };
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export interface PlaylistBrowserProps {
  onPlaylistSelect: (playlist: SpotifyPlaylist) => void;
  className?: string;
}

export interface PlaylistSongsListProps {
  playlist: SpotifyPlaylist;
  onSongSelect: (song: SpotifyTrack) => void;
  className?: string;
}

export interface SongBrowserProps {
  onSongSelect: (song: SpotifyTrack) => void;
  className?: string;
}

export interface BatchGameEditorProps {
  month: string;
  className?: string;
}

// Utility component props
export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

// Archive component props
export interface ArchiveContentProps {
  month?: string;
}

export interface CalendarViewProps {
  month: string;
  games: GameState[];
}

// Game-specific component props
export interface ScrambleTitleProps {
  title: string;
  date: string;
}

export interface DateDisplayProps {
  date: string;
  className?: string;
}

export interface YesterdayStatsProps {
  currentDate: string;
  className?: string;
}

export interface Letter {
  char: string;
  isScrambled: boolean;
  originalIndex: number;
}

export interface ErrorContextType {
  showError: (message: string) => void;
  hideError: () => void;
  errorMessage: string | null;
  isVisible: boolean;
}

export interface ErrorProviderProps {
  children: React.ReactNode;
}

export interface MonthArchivePageProps {
  params: Promise<{ month: string }>;
} 