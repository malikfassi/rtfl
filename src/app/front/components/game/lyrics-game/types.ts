import type { Token, Guess, GameState } from '@/app/types';

export interface LyricsGameProps {
  gameState: GameState | null;
  onGuess: (word: string) => Promise<void>;
  onShowFullLyrics: () => void;
  date: string;
  playerId?: string;
}

export interface MaskedLyricsDisplayProps {
  title?: Token[];
  artist?: Token[];
  lyrics?: Token[];
  highlightedWord: string | null;
  scrollToWord: string | null;
  showFullLyrics: boolean;
  fullSongData?: {
    title?: string;
    artist?: string;
    lyrics?: string;
  };
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export interface GameHeaderProps {
  date: string;
  isGameWon: boolean;
  guessCount: number;
}

export interface GuessInputProps {
  onGuessSubmit: (guess: string) => Promise<void>;
  pendingGuess: string | null;
  disabled: boolean;
  onDuplicateGuess?: (guess: string) => void;
}

export interface GuessHistoryProps {
  guesses: Guess[];
  gameState: GameState;
  onWordHover: (word: string | null) => void;
  onWordClick: (word: string | null) => void;
  highlightedWord: string | null;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
}

export interface GameCompletionProps {
  songData: {
    title?: string;
    artist?: string;
    lyrics?: string;
  };
  guessCount: number;
  showFullLyrics: boolean;
  onShowFullLyrics: () => void;
  onShare: () => void;
}

export interface WinPopupProps {
  isOpen: boolean;
  onClose: () => void;
  gameStats: {
    totalGuesses: number;
    correctGuesses: number;
    accuracy: number;
    wordsFound: number;
  };
  onShare: () => void;
  onShowFullLyrics: () => void;
  showFullLyrics: boolean;
}

export interface GameTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

export interface PathToVictoryProps {
  lyricsProgress: {
    found: number;
    total: number;
  };
  titleProgress: {
    found: number;
    total: number;
  };
  artistProgress: {
    found: number;
    total: number;
  };
  totalWords: number;
  foundWords: number;
  isGameComplete: boolean;
  guesses?: Guess[];
  highlightedWord?: string | null;
}

export interface ShareButtonProps {
  gameStats: {
    totalGuesses: number;
    correctGuesses: number;
    accuracy: number;
  };
  songInfo: {
    title?: string;
    artist?: string;
  };
  date: string;
  className?: string;
}
