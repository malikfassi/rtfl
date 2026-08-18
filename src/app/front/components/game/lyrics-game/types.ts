import type { Guess, GameState } from '@/app/types';

export interface LyricsGameProps {
  gameState: GameState | null;
  onGuess: (word: string) => Promise<GameState | void>;
  onShowFullLyrics: () => void;
  date: string;
  playerId?: string;
}

export interface GuessInputProps {
  onGuessSubmit: (guess: string) => Promise<number>;
  pendingGuess: string | null;
  disabled: boolean;
  onDuplicateGuess?: (guess: string) => void;
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
