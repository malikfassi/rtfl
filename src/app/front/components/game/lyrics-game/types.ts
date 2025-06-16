export interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
}

export interface ScrambleTitleProps {
  title: string;
  date: string;
}

export interface MaskedLyricsProps {
  title: string;
  artist: string;
  lyrics: string;
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
  isComplete?: boolean;
  foundWords: string[];
  hoveredWord?: string | null;
  selectedWord?: string | null;
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  colors: Array<{ bg: string; text: string; }>;
  song?: { lyrics: string; } | null;
  isAdmin?: boolean;
  showFullLyrics?: boolean;
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
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
  onGuess: (guess: string) => Promise<void>;
  isSubmitting: boolean;
  onWordHover: (word: string | null) => void;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
  colors: Array<{ bg: string; text: string; }>;
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

export interface YesterdayStatsProps {
  currentDate: string;
  className?: string;
} 